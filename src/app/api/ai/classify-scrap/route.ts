import { NextResponse } from 'next/server';
import { WasteCategory, STANDARD_SCRAP_RATES, WASTE_CATEGORY_LABELS } from '@/types';

export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Map specific detected materials to ScrapMax standard WasteCategory
function mapToWasteCategory(material: string): WasteCategory {
  const m = material.toLowerCase();
  if (m.includes('pcb') || m.includes('electronic') || m.includes('circuit') || m.includes('battery') || m.includes('screen') || m.includes('lcd') || m.includes('crt')) {
    return 'E_WASTE';
  }
  if (m.includes('paper') || m.includes('cardboard') || m.includes('carton') || m.includes('box') || m.includes('newspaper') || m.includes('magazine')) {
    return 'PAPER';
  }
  if (m.includes('plastic') || m.includes('bottle') || m.includes('poly') || m.includes('pvc') || m.includes('container')) {
    return 'PLASTIC';
  }
  if (m.includes('metal') || m.includes('iron') || m.includes('steel') || m.includes('copper') || m.includes('cable') || m.includes('wire') || m.includes('aluminum') || m.includes('motor') || m.includes('magnet')) {
    return 'METAL';
  }
  if (m.includes('glass') || m.includes('jar')) {
    return 'GLASS';
  }
  return 'METAL'; // sensible default for recyclable scrap
}

export async function POST(req: Request) {
  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const inputVal = body.imageBase64 || body.photo || '';
      const rawImage = Array.isArray(inputVal) ? inputVal.join('') : String(inputVal);
      if (!rawImage || rawImage.trim() === '') {
        return NextResponse.json({ error: 'imageBase64 or photo is required' }, { status: 400 });
      }

      // Handle data:image/...;base64, prefix if present
      if (rawImage.includes('base64,')) {
        const parts = rawImage.split('base64,');
        const mimeMatch = parts[0].match(/:(.*?);/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        base64Data = parts[1];
      } else {
        base64Data = rawImage;
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
      }
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type. Send JSON with imageBase64 or multipart/form-data' }, { status: 400 });
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'No valid image data provided' }, { status: 400 });
    }

    // Prepare prompt for multimodal scrap validation, material identification AND physical quality inspection
    const promptText = `
You are ScrapMax AI, an advanced computer vision model specialized in recyclable waste, scrap classification, and fraud prevention for scrap pickups in India.

CRITICAL FIRST STEP - VALIDITY CHECK:
Determine whether the uploaded image actually contains recyclable scrap or discarded waste material (e.g., cardboard boxes, scrap paper/books, plastic bottles/containers, iron/steel scrap, e-waste/circuit boards/cables/batteries, machinery parts, glass bottles, metal cans).
- If the image is unrelated to recyclable scrap — for example: a human person, selfie, face, body, animal, pet, cooked food, dish, scenery, nature, room/building interior, luxury furniture, clothing/shoes, vehicle in use, screenshot, meme, wallpaper, or random non-scrap object:
  Set "is_valid_scrap": false
  Set "rejection_reason": "No recyclable scrap material detected. The photo appears to show an unrelated subject. Please upload a clear photo of physical recyclable waste (cardboard, paper, plastic, metal, e-waste, or glass)."
  Set "detected_material": "non_scrap"
  Set "recyclability_grade": "Not Applicable"
  Set "deduction_percent": 0

- If the image DOES contain recyclable scrap or waste:
  Set "is_valid_scrap": true
  Set "rejection_reason": null
  Inspect the scrap material with extreme care for BOTH material identification AND physical quality/defects:
  1. Material Category: exactly one of ["cardboard", "paper", "pcb", "batteries", "cables", "iron", "mixed_plastics", "motors", "glass", "other"]
  2. Moisture / Water Soaking: "dry" | "damp" | "soaked_wet" (Check for water stains, dark damp patches, or sogginess on cardboard/paper - "gilla kabaad")
  3. Rust & Oxidation: "none" | "surface_rust" | "heavy_corrosion" (For iron/metal junk - "zang laga hua loha")
  4. Contamination: "clean" | "dusty_debris" | "oil_stained" | "mixed_impurities"
  5. Recyclability Grade: "Grade A (Prime)" | "Grade B (Standard)" | "Grade C (Degraded / Junk)"
  6. Deduction Percent: integer between 0 and 50 (Penalty for water weight inflation, rust weight loss, or heavy impurities)
  7. Quality Verdict: 1 concise sentence in English/Hindi explaining physical condition and rate impact

Respond ONLY with a JSON object matching this schema:
{
  "is_valid_scrap": true,
  "rejection_reason": null,
  "detected_material": "name_of_material or non_scrap",
  "confidence_score": 92.5,
  "moisture_status": "dry" | "damp" | "soaked_wet",
  "rust_status": "none" | "surface_rust" | "heavy_corrosion",
  "contamination": "clean" | "dusty_debris" | "oil_stained" | "mixed_impurities",
  "recyclability_grade": "Grade A (Prime)" | "Grade B (Standard)" | "Grade C (Degraded / Junk)" | "Not Applicable",
  "deduction_percent": 0,
  "quality_verdict": "explanation of condition",
  "reasoning": "visual details detected in the photo",
  "visual_quality": "good" | "fair" | "poor",
  "estimated_weight_range_kg": "e.g. 2 - 5"
}
`.trim();

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    };

    const rawKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GEMINI_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      GEMINI_API_KEY ||
      '';
    const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        isKeyMissing: true,
        isValidScrap: false,
        rejectionReason:
          'Gemini AI API key is not configured in Vercel. Please add GEMINI_API_KEY under Project Settings ➔ Environment Variables, then click Redeploy.',
        detectedMaterial: 'non_scrap',
        confidence: 0,
        reasoning: 'GEMINI_API_KEY environment variable is not configured.',
        engine: 'Setup Required',
        isRealAi: false,
      });
    }

    const candidateModels = Array.from(
      new Set(
        [
          'gemini-3.6-flash',
          'gemini-3.7-flash',
          process.env.GEMINI_MODEL,
          GEMINI_MODEL,
          'gemini-3.1-flash-lite',
        ].filter(Boolean)
      )
    ) as string[];

    let geminiResult: Record<string, unknown> | null = null;
    let successfulModel = candidateModels[0] || 'gemini-3.6-flash';

    if (apiKey) {
      for (const modelName of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (response.ok) {
            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              geminiResult = JSON.parse(rawText) as Record<string, unknown>;
              successfulModel = modelName;
              break;
            }
          } else {
            console.warn(`Model ${modelName} returned status ${response.status}, trying next model...`);
          }
        } catch {
          console.warn(`Model ${modelName} failed or timed out, trying next model...`);
        }
      }
    }

    // If Gemini responded
    if (geminiResult) {
      const isValidScrap =
        geminiResult.is_valid_scrap !== false &&
        String(geminiResult.detected_material).toLowerCase() !== 'non_scrap';

      // If photo is unrelated to scrap/waste (screenshot, selfie, pet, food, random object, etc.)
      if (!isValidScrap) {
        return NextResponse.json({
          success: true,
          isValidScrap: false,
          rejectionReason:
            geminiResult.rejection_reason ||
            'No recyclable scrap material detected in this photo. Please upload a clear photo of physical recyclable waste (cardboard, paper, plastic, metal, e-waste, or glass).',
          detectedMaterial: geminiResult.detected_material || 'non_scrap',
          reasoning:
            geminiResult.reasoning ||
            'Photo does not contain any recyclable scrap or waste material.',
          confidence: Math.round(Number(geminiResult.confidence_score) || 95),
          engine: `Gemini Vision (${successfulModel})`,
          isRealAi: true,
        });
      }

      // Valid scrap material detected
      const material = String(geminiResult.detected_material).toLowerCase();
      const category = mapToWasteCategory(material);
      const baseRate = STANDARD_SCRAP_RATES[category] || 25;
      const labelInfo = WASTE_CATEGORY_LABELS[category];

      const deduction = Math.min(Math.max(Number(geminiResult.deduction_percent) || 0, 0), 50);
      const adjustedRate = Math.round(baseRate * (1 - deduction / 100));

      const moisture = String(geminiResult.moisture_status || 'dry').toLowerCase();
      const rust = String(geminiResult.rust_status || 'none').toLowerCase();
      const grade =
        geminiResult.recyclability_grade ||
        (deduction === 0
          ? 'Grade A (Prime)'
          : deduction <= 20
          ? 'Grade B (Standard)'
          : 'Grade C (Degraded / Junk)');

      return NextResponse.json({
        success: true,
        isValidScrap: true,
        material,
        category,
        categoryName: labelInfo?.label || category,
        icon: labelInfo?.icon || '♻️',
        confidence: Math.round(Number(geminiResult.confidence_score) || 94),
        reasoning: geminiResult.reasoning || 'Identified via Gemini Multimodal Vision.',
        visualQuality: geminiResult.visual_quality || (deduction === 0 ? 'good' : 'fair'),
        qualityInspection: {
          moistureStatus: moisture,
          rustStatus: rust,
          contamination: geminiResult.contamination || 'clean',
          recyclabilityGrade: grade,
          deductionPercent: deduction,
          qualityVerdict:
            geminiResult.quality_verdict ||
            (moisture !== 'dry'
              ? 'Moisture detected - rate adjusted for water weight.'
              : 'Clean & dry condition verified.'),
        },
        estimatedWeightRangeKg: geminiResult.estimated_weight_range_kg || '2 - 5 kg',
        ratePerKg: adjustedRate,
        baseRatePerKg: baseRate,
        deductionPercent: deduction,
        engine: `Gemini Vision (${successfulModel})`,
        isRealAi: true,
      });
    }

    // Safety fallback: if no AI could verify or key is missing, explain clearly
    const fallbackNotice = !apiKey
      ? 'Gemini AI API key is not configured in Vercel. Please add GEMINI_API_KEY under Project Settings ➔ Environment Variables, then click Redeploy.'
      : 'Unable to verify recyclable scrap material in this image. Please ensure the scrap item is clearly visible, well-lit, and centered.';

    return NextResponse.json({
      success: true,
      isValidScrap: false,
      rejectionReason: fallbackNotice,
      detectedMaterial: 'non_scrap',
      confidence: 0,
      reasoning: !apiKey ? 'API Key missing.' : 'AI Vision models temporarily busy.',
      engine: 'ScrapMax Guardrail Engine',
      isRealAi: false,
    });
  } catch (error: unknown) {
    console.error('Error in /api/ai/classify-scrap:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during classification';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

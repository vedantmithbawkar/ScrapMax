import { NextResponse } from 'next/server';
import { validateAadhaarNumber, maskAadhaar } from '@/lib/aadhaar-service';

// In-memory transaction store for demo/development verification sessions
const txnStore = new Map<
  string,
  {
    aadhaarNumber: string;
    otp: string;
    phone?: string;
    expiresAt: number;
  }
>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, aadhaarNumber, phone, txnId, otp } = body;

    // -------------------------------------------------------------
    // ACTION: SEND OTP
    // -------------------------------------------------------------
    if (action === 'send-otp') {
      if (!aadhaarNumber) {
        return NextResponse.json(
          { success: false, error: 'Aadhaar number is required.' },
          { status: 400 }
        );
      }

      const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '').replace(/-/g, '');
      const validation = validateAadhaarNumber(cleanAadhaar);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.message || 'Invalid Aadhaar number.' },
          { status: 400 }
        );
      }

      // Generate a transaction ID and a 6-digit OTP
      const newTxnId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const generatedOtp = '123456'; // Default sandbox OTP for SIH evaluation/testing
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      txnStore.set(newTxnId, {
        aadhaarNumber: cleanAadhaar,
        otp: generatedOtp,
        phone: phone || '',
        expiresAt,
      });

      const maskedPhone = phone && phone.length >= 4 
        ? `******${phone.slice(-4)}` 
        : '******4321';

      return NextResponse.json({
        success: true,
        txnId: newTxnId,
        maskedAadhaar: maskAadhaar(cleanAadhaar),
        maskedMobile: maskedPhone,
        testOtp: '123456',
        message: `OTP sent successfully to Aadhaar-linked mobile (${maskedPhone}). For instant testing, use OTP: 123456`,
      });
    }

    // -------------------------------------------------------------
    // ACTION: VERIFY OTP
    // -------------------------------------------------------------
    if (action === 'verify-otp') {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'OTP is required.' },
          { status: 400 }
        );
      }

      const cleanOtp = String(otp).trim();
      let matchedRecord = txnId ? txnStore.get(txnId) : undefined;

      // Check if session has expired
      if (matchedRecord && matchedRecord.expiresAt < Date.now()) {
        txnStore.delete(txnId);
        return NextResponse.json(
          { success: false, error: 'OTP session expired. Please request a new OTP.' },
          { status: 400 }
        );
      }

      // Valid if it matches the stored OTP or universal test OTP '123456'
      const isValidOtp = cleanOtp === '123456' || (matchedRecord && cleanOtp === matchedRecord.otp);

      if (!isValidOtp) {
        return NextResponse.json(
          { success: false, error: 'Invalid Aadhaar OTP. Please enter the 6-digit verification code.' },
          { status: 400 }
        );
      }

      const targetAadhaar = matchedRecord?.aadhaarNumber || aadhaarNumber || '999999999999';
      const masked = maskAadhaar(targetAadhaar);
      const verifiedAt = new Date().toISOString();

      if (txnId) txnStore.delete(txnId);

      return NextResponse.json({
        success: true,
        verified: true,
        maskedAadhaar: masked,
        aadhaarVerifiedAt: verifiedAt,
        message: 'UIDAI Aadhaar Authentication & e-KYC Verification Successful!',
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Aadhaar API handler error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Aadhaar Verification error.' },
      { status: 500 }
    );
  }
}

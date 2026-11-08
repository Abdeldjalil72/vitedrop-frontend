"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { apiVerifyEmail, apiResendVerification } from "@/lib/api-client";
import { getLocalizedAuthError } from "@/lib/locales";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialRole = searchParams.get("role") || "";
  const isUnverifiedRedirect = searchParams.get("unverified") === "true";

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(isUnverifiedRedirect ? 0 : 60);
  const [canResend, setCanResend] = useState<boolean>(isUnverifiedRedirect);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric character
    const cleaned = value.replace(/\D/g, "");

    // Handle multi-character paste into one slot
    if (cleaned.length > 1) {
      handlePaste(cleaned);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1);
    setDigits(newDigits);
    setError("");

    // Advance focus to next input if digit entered
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits filled
    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      submitCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (pasted: string) => {
    const raw = pasted.replace(/\D/g, "").slice(0, 6);
    if (!raw) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < raw.length; i++) {
      newDigits[i] = raw[i];
    }
    setDigits(newDigits);
    setError("");

    if (raw.length === 6) {
      submitCode(raw);
    } else {
      inputRefs.current[raw.length]?.focus();
    }
  };

  const submitCode = async (codeToSubmit?: string) => {
    const code = codeToSubmit || digits.join("");
    if (code.length !== 6) {
      setError("Veuillez saisir les 6 chiffres du code reçu par e-mail.");
      return;
    }

    if (!email) {
      setError("Adresse e-mail requise.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await apiVerifyEmail({ email, code });
      setIsLoading(false);
      setSuccess("Adresse e-mail confirmée avec succès ! Redirection en cours...");

      setTimeout(() => {
        if (res.user?.role === "SUPPLIER" || res.user?.role === "CALL_CENTER_AGENT") {
          router.push("/supplier");
        } else if (res.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/affiliate");
        }
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Code invalide ou expiré.");
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    if (!email) {
      setError("Veuillez indiquer votre adresse e-mail.");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiResendVerification(email);
      setIsResending(false);
      if (res?.isAlreadyVerified) {
        setSuccess("Cette adresse e-mail est déjà confirmée. Redirection vers la page de connexion...");
        setTimeout(() => router.push("/login"), 1200);
        return;
      }
      setSuccess("Un nouveau code à 6 chiffres a été envoyé par email.");
      setCooldown(60);
      setCanResend(false);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setIsResending(false);
      setError(err?.message || "Impossible de renvoyer le code pour le moment.");
    }
  };

  return (
    <AuthCard initialLang="fr">
      {({ lang }) => {
        const isAr = lang === "ar";
        const isEn = lang === "en";

        return (
          <div className="space-y-6 text-start">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {isAr
                  ? "تأكيد البريد الإلكتروني"
                  : isEn
                    ? "Verify your email"
                    : "Vérifiez votre e-mail"}
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-1.5 max-w-sm mx-auto">
                {isAr
                  ? `أدخل رمز التحقق المكون من 6 أرقام المرسل إلى`
                  : isEn
                    ? `Enter the 6-digit verification code sent to`
                    : `Saisissez le code de confirmation à 6 chiffres envoyé à`}
                <br />
                <span dir="ltr" className="font-semibold text-neutral-800 break-all">
                  {email || (isAr ? "بريدك الإلكتروني" : isEn ? "your email address" : "votre adresse email")}
                </span>
              </p>
            </div>

            {isUnverifiedRedirect && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {isAr
                    ? "يرجى تأكيد بريدك الإلكتروني أولاً لتفعيل حسابك ومتابعة الدخول."
                    : isEn
                      ? "Please confirm your email address first to activate your account."
                      : "Votre compte n'est pas encore activé. Veuillez saisir le code reçu par e-mail."}
                </span>
              </div>
            )}

            {error && (
              <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{getLocalizedAuthError(error, lang)}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {success.includes("confirmée")
                    ? isAr
                      ? "تم تأكيد البريد الإلكتروني بنجاح! جارٍ التوجيه..."
                      : isEn
                        ? "Email address verified! Redirecting..."
                        : success
                    : success.includes("nouveau code")
                      ? isAr
                        ? "تم إرسال رمز تحقق جديد مكون من 6 أرقام إلى بريدك الإلكتروني."
                        : isEn
                          ? "A new 6-digit verification code has been sent to your email."
                          : success
                      : success}
                </span>
              </div>
            )}

            {/* 6-Digit OTP Inputs */}
            <div className="space-y-4">
              <div
                dir="ltr"
                className="flex justify-center items-center gap-1.5 sm:gap-3"
                onPaste={(e) => {
                  e.preventDefault();
                  handlePaste(e.clipboardData.getData("text"));
                }}
              >
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    data-testid={`otp-digit-${idx}`}
                    aria-label={
                      isAr
                        ? `الرقم ${idx + 1} من 6`
                        : isEn
                          ? `Digit ${idx + 1} of 6`
                          : `Chiffre ${idx + 1} sur 6`
                    }
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-2xl font-bold font-mono rounded-xl border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs transition-all"
                  />
                ))}
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  size="md"
                  isLoading={isLoading}
                  onClick={() => submitCode()}
                  className="w-full"
                >
                  {isAr ? "تأكيد الرمز وتفعيل الحساب" : isEn ? "Verify & Activate" : "Valider et activer mon compte"}
                </Button>
              </div>
            </div>

            {/* Resend Cooldown Section */}
            <div className="text-center pt-3 border-t border-black/[0.06] text-xs space-y-2">
              <p className="text-[#6b6b6b]">
                {isAr ? "لم تستلم الرمز بعد؟" : isEn ? "Didn't receive the code?" : "Vous n'avez pas reçu le code ?"}
              </p>
              <div>
                {canResend ? (
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                    <span>{isAr ? "إعادة إرسال رمز جديد" : isEn ? "Resend code" : "Renvoyer un nouveau code"}</span>
                  </button>
                ) : (
                  <span className="text-[#888888]">
                    {isAr
                      ? `يمكنك طلب رمز جديد بعد (${cooldown} ثانية)`
                      : isEn
                        ? `Resend available in (${cooldown}s)`
                        : `Renvoyer un code disponible dans (${cooldown}s)`}
                  </span>
                )}
              </div>
            </div>

            {/* Correction / Re-register Link */}
            <div className="text-center text-xs text-[#6b6b6b] space-y-2.5">
              <div>
                <Link
                  href={`/register?email=${encodeURIComponent(email)}${initialRole ? `&role=${initialRole}` : ""}`}
                  className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                >
                  {isAr
                    ? "هل أخطأت في البريد أو تريد تعديل بياناتك؟ اضغط هنا"
                    : isEn
                      ? "Wrong email or need to modify details? Click here"
                      : "Mauvaise adresse ou informations à modifier ? Cliquez ici"}
                </Link>
              </div>

              <div>
                <Link
                  href="/login"
                  className="font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  {isAr ? "العودة إلى تسجيل الدخول" : isEn ? "Back to login" : "Retour à la page de connexion"}
                </Link>
              </div>
            </div>
          </div>
        );
      }}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}


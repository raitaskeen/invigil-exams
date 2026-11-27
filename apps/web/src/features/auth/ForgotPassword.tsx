"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Key } from "@phosphor-icons/react";
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordInput, type ResetPasswordInput } from "@np/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthField, AuthSubmit } from "@/features/auth/AuthField";
import { api, apiErrorMessage, applyFieldErrors } from "@/lib/api-client";

type Step = "request" | "requested" | "reset" | "done";

/**
 * Password recovery without paid email: 1) the user files a request, 2) an administrator issues a one-time
 * 8-character code (Users -> Password resets), 3) the user enters it here with a new password.
 */
export function ForgotPassword({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(defaultEmail);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStep("request");
          setOpen(true);
        }}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Forgot password?
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key weight="duotone" className="size-5 text-primary" aria-hidden="true" />
              {step === "reset" || step === "done" ? "Set a new password" : "Reset your password"}
            </DialogTitle>
            <DialogDescription>
              {step === "request" && "Enter your account email. An administrator will issue you a one-time reset code."}
              {step === "requested" && "Request received."}
              {step === "reset" && "Enter the 8-character code from your administrator and choose a new password."}
              {step === "done" && "All set."}
            </DialogDescription>
          </DialogHeader>
          {step === "request" && (
            <RequestForm
              defaultEmail={email}
              onDone={(e) => {
                setEmail(e);
                setStep("requested");
              }}
              onHaveCode={() => setStep("reset")}
            />
          )}
          {step === "requested" && (
            <div className="space-y-4">
              <Alert role="status">
                <CheckCircle weight="fill" className="text-success" />
                <AlertDescription>
                  If an account exists for <b>{email}</b>, your request is now with the administrators. They will give you a one-time code that is valid for 30 minutes.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setStep("reset")}>I have a reset code</Button>
            </div>
          )}
          {step === "reset" && <ResetForm defaultEmail={email} onDone={() => setStep("done")} />}
          {step === "done" && (
            <div className="space-y-4">
              <Alert role="status">
                <CheckCircle weight="fill" className="text-success" />
                <AlertDescription>Your password has been changed and every other session was signed out. Sign in with your new password.</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setOpen(false)}>Back to sign in</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestForm({ defaultEmail, onDone, onHaveCode }: { defaultEmail: string; onDone: (email: string) => void; onHaveCode: () => void }) {
  const [error, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, dirtyFields } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: defaultEmail },
  });
  async function onSubmit(v: ForgotPasswordInput) {
    setFormError(null);
    try {
      await api("/auth/forgot-password", { method: "POST", json: v });
      onDone(v.email);
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(apiErrorMessage(err));
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <AuthField id="forgot-email" label="Email" type="email" autoComplete="username" placeholder="you@example.com" registration={register("email")} error={errors.email?.message} dirty={!!dirtyFields.email} />
      <AuthSubmit pending={isSubmitting} label="Request reset code" pendingLabel="Sending request..." />
      <button type="button" onClick={onHaveCode} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Already have a code?
      </button>
    </form>
  );
}

function ResetForm({ defaultEmail, onDone }: { defaultEmail: string; onDone: () => void }) {
  const [error, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, dirtyFields } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: defaultEmail, code: "", password: "", confirm: "" },
  });
  async function onSubmit(v: ResetPasswordInput) {
    setFormError(null);
    try {
      await api("/auth/reset-password", { method: "POST", json: v });
      onDone();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(apiErrorMessage(err));
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <AuthField id="reset-email" label="Email" type="email" autoComplete="username" registration={register("email")} error={errors.email?.message} dirty={!!dirtyFields.email} />
      <AuthField id="reset-code" label="Reset code" autoComplete="one-time-code" placeholder="8 letters and numbers" registration={register("code")} error={errors.code?.message} dirty={!!dirtyFields.code} />
      <AuthField id="reset-password" label="New password" type="password" autoComplete="new-password" hint="8+ characters, a letter and a number" registration={register("password")} error={errors.password?.message} dirty={!!dirtyFields.password} />
      <AuthField id="reset-confirm" label="Repeat new password" type="password" autoComplete="new-password" registration={register("confirm")} error={errors.confirm?.message} dirty={!!dirtyFields.confirm} />
      <AuthSubmit pending={isSubmitting} label="Change password" pendingLabel="Changing password..." />
    </form>
  );
}

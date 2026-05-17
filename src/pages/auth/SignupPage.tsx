import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Layers2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormValues {
    fullName: string;
    businessName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export default function SignupPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signUp } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<SignupFormValues>({
        defaultValues: {
            fullName: "",
            businessName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: SignupFormValues) => {
        if (values.password !== values.confirmPassword) {
            form.setError("confirmPassword", {
                type: "validate",
                message: "Passwords do not match.",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            await signUp({
                fullName: values.fullName,
                businessName: values.businessName,
                email: values.email,
                password: values.password,
            });
            toast({
                title: "Account created",
                description:
                    "Your workspace has been created successfully. You can now sign in.",
            });
            navigate("/login", { replace: true });
        } catch (error: any) {
            toast({
                title: "Sign up failed",
                description:
                    error?.message || "Unable to create your account.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-sidebar relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sidebar-accent opacity-30" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-sidebar-primary opacity-10 translate-x-1/3 translate-y-1/3" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-sidebar-border opacity-20" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-sidebar-border opacity-10" />
                </div>

                {/* Logo */}
                <div className="relative flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
                        <Layers2 className="w-5 h-5 text-sidebar-primary-foreground" />
                    </div>
                    <span className="text-sidebar-foreground font-semibold text-lg tracking-tight">Logbook</span>
                </div>

                {/* Center content */}
                <div className="relative space-y-6">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-sidebar-foreground leading-tight">
                            Start managing your<br />business today.
                        </h2>
                        <p className="text-sidebar-foreground/60 text-base leading-relaxed max-w-xs">
                            Set up your workspace in minutes. Your team will be creating work orders before you know it.
                        </p>
                    </div>

                    {/* Feature bullets */}
                    <div className="space-y-3">
                        {[
                            "Work order tracking & management",
                            "Delivery challan generation & printing",
                            "Invoice management with GST support",
                        ].map((feat) => (
                            <div key={feat} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center flex-shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-sidebar-primary" />
                                </div>
                                <span className="text-sidebar-foreground/70 text-sm">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative">
                    <p className="text-sidebar-foreground/40 text-xs">
                        © {new Date().getFullYear()} Logbook by Tovak. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-background overflow-y-auto">
                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-8 lg:hidden">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Layers2 className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-lg">Logbook</span>
                </div>

                <div className="w-full max-w-sm space-y-8">
                    {/* Header */}
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your workspace</h1>
                        <p className="text-sm text-muted-foreground">
                            Set up your account to start managing operations.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Jane Smith"
                                className="h-10"
                                {...form.register("fullName", {
                                    required: "Full name is required.",
                                })}
                            />
                            {form.formState.errors.fullName && (
                                <p className="text-xs text-destructive mt-1">
                                    {form.formState.errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessName" className="text-sm font-medium">Business Name</Label>
                            <Input
                                id="businessName"
                                placeholder="Acme Industries"
                                className="h-10"
                                {...form.register("businessName", {
                                    required: "Business name is required.",
                                })}
                            />
                            {form.formState.errors.businessName && (
                                <p className="text-xs text-destructive mt-1">
                                    {form.formState.errors.businessName.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@company.com"
                                className="h-10"
                                {...form.register("email", {
                                    required: "Email is required.",
                                })}
                            />
                            {form.formState.errors.email && (
                                <p className="text-xs text-destructive mt-1">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Min. 6 characters"
                                    className="h-10 pr-10"
                                    {...form.register("password", {
                                        required: "Password is required.",
                                        minLength: {
                                            value: 6,
                                            message: "Password must be at least 6 characters.",
                                        },
                                    })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-xs text-destructive mt-1">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="h-10 pr-10"
                                    {...form.register("confirmPassword", {
                                        required: "Please confirm your password.",
                                    })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.formState.errors.confirmPassword && (
                                <p className="text-xs text-destructive mt-1">
                                    {form.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 font-medium"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account…
                                </span>
                            ) : "Create Account"}
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-primary hover:underline underline-offset-4"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
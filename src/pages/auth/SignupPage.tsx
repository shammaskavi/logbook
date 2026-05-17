

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

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
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-lg shadow-sm p-8 space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Create your account
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Set up your workspace and start managing your operations.
                        </p>
                    </div>

                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                {...form.register("fullName", {
                                    required: "Full name is required.",
                                })}
                            />
                            {form.formState.errors.fullName && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                                id="businessName"
                                {...form.register("businessName", {
                                    required: "Business name is required.",
                                })}
                            />
                            {form.formState.errors.businessName && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.businessName.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                {...form.register("email", {
                                    required: "Email is required.",
                                })}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                {...form.register("password", {
                                    required: "Password is required.",
                                    minLength: {
                                        value: 6,
                                        message: "Password must be at least 6 characters.",
                                    },
                                })}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                {...form.register("confirmPassword", {
                                    required: "Please confirm your password.",
                                })}
                            />
                            {form.formState.errors.confirmPassword && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating account..." : "Create Account"}
                        </Button>
                    </form>

                    <p className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
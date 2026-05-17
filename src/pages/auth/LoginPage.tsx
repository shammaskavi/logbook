

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormValues {
    email: string;
    password: string;
}

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { signIn } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<LoginFormValues>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const from =
        (location.state as { from?: { pathname?: string } } | null)?.from
            ?.pathname || "/";

    const onSubmit = async (values: LoginFormValues) => {
        try {
            setIsSubmitting(true);

            await signIn(values.email, values.password);

            toast({
                title: "Welcome back",
                description: "You have been signed in successfully.",
            });

            navigate(from, { replace: true });
        } catch (error: any) {
            toast({
                title: "Sign in failed",
                description:
                    error?.message || "Please check your credentials and try again.",
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
                        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your workspace.
                        </p>
                    </div>

                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
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
                                autoComplete="current-password"
                                {...form.register("password", {
                                    required: "Password is required.",
                                })}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <p className="text-sm text-center text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-medium text-primary hover:underline"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
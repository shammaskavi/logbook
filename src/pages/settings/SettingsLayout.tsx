

import { Outlet, NavLink } from "react-router-dom";

export default function SettingsLayout() {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Preferences</h1>
                <p className="text-sm text-muted-foreground">
                    Manage master data and application preferences
                </p>
            </div>

            {/* Settings Tabs */}
            <div className="border-b border-border mb-6">
                <nav className="flex gap-6">
                    <NavLink
                        to="/settings/parties"
                        className={({ isActive }) =>
                            `pb-3 text-sm font-medium border-b-2 transition-colors ${isActive
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`
                        }
                    >
                        Parties
                    </NavLink>

                    <NavLink
                        to="/settings/job-works"
                        className={({ isActive }) =>
                            `pb-3 text-sm font-medium border-b-2 transition-colors ${isActive
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`
                        }
                    >
                        Job Works
                    </NavLink>
                </nav>
            </div>

            {/* Nested Page Content */}
            <Outlet />
        </div>
    );
}
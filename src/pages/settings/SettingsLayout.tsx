import { Outlet, NavLink } from "react-router-dom";

const tabs = [
    {
        label: "Business Profile",
        to: "/settings/business",
    },
    {
        label: "Parties",
        to: "/settings/parties",
    },
    {
        label: "Job Works",
        to: "/settings/job-works",
    },
];

export default function SettingsLayout() {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Preferences</h1>
                <p className="text-sm text-muted-foreground">
                    Manage master data and application preferences
                </p>
            </div>

            <div className="border-b border-border mb-6">
                <nav className="flex gap-6">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) =>
                                `pb-3 text-sm font-medium border-b-2 transition-colors ${isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <Outlet />
        </div>
    );
}
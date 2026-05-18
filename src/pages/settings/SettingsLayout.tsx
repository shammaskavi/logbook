import { Outlet, NavLink } from "react-router-dom";

const tabs = [
    { label: "Business Profile", to: "/settings/business" },
    { label: "Parties", to: "/settings/parties" },
    { label: "Job Works", to: "/settings/job-works" },
];

export default function SettingsLayout() {
    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Preferences</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage master data and application preferences
                </p>
            </div>

            {/* Tabs — horizontal scroll on mobile, no wrapping */}
            <div className="relative border-b border-border mb-6">
                <nav className="flex gap-1 overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) =>
                                `pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                                    isActive
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
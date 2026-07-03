import sys
import re

with open("src/App.jsx", "r") as f:
    c = f.read()

# Replace eager imports with lazy imports
pages_to_lazy = [
    "Preferences", "CompanyPreferences", "Dashboard", "CompanyDashboard", 
    "AddProject", "MyProjects", "ApplicantsHub", "AnalyticsDashboard", 
    "StudentProfile", "ResetPasswordPage", "ChatPage", "NotFoundPage", 
    "ProjectDetails", "LandingPage", "AboutPage", "AdminDashboard", 
    "CalendarView", "CompanySettings", "CollegeDashboard", "PlacementPipeline", 
    "ResumeChecker", "FacultyDashboard"
]

for page in pages_to_lazy:
    # Match standard import: import Page from "./pages/Page";
    pattern = rf'import\s+{page}\s+from\s+["\']\./pages/{page}["\'];(\s*//.*)?'
    replacement = f'const {page} = React.lazy(() => import("./pages/{page}"));'
    c = re.sub(pattern, replacement, c)

# The LegalPages are exported differently
c = re.sub(
    r'import\s+\{\s*TermsPage,\s*PrivacyPage,\s*RefundPage\s*\}\s+from\s+["\']\./pages/LegalPages["\'];',
    '''const TermsPage = React.lazy(() => import("./pages/LegalPages").then(module => ({ default: module.TermsPage })));
const PrivacyPage = React.lazy(() => import("./pages/LegalPages").then(module => ({ default: module.PrivacyPage })));
const RefundPage = React.lazy(() => import("./pages/LegalPages").then(module => ({ default: module.RefundPage })));''',
    c
)

# Now inject Suspense boundary around <Routes>
routes_start = c.find("<Routes>")
if routes_start != -1:
    c = c.replace(
        "<Routes>",
        "<Suspense fallback={<div className=\"flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900 text-indigo-500 font-bold tracking-widest text-sm uppercase\">Loading Platform...</div>}>\n          <Routes>"
    )
    c = c.replace(
        "</Routes>",
        "</Routes>\n        </Suspense>"
    )

with open("src/App.jsx", "w") as f:
    f.write(c)

print("App.jsx refactored for code-splitting")

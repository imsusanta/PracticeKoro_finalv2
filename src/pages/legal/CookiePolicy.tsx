import LegalLayout from "@/components/legal/LegalLayout";

const CookiePolicy = () => {
    return (
        <LegalLayout title="Cookie Policy" lastUpdated="January 30, 2026">
            <section className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What are Cookies?</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Cookies</h2>
                    <p className="text-slate-600 mb-4">
                        Practice Koro uses cookies for the following purposes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600">
                        <li><strong>Necessary Cookies:</strong> These are essential for the website to function correctly. They include, for example, cookies that enable you to log into secure areas of our platform.</li>
                        <li><strong>Analytical/Performance Cookies:</strong> They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it (e.g., Google Analytics).</li>
                        <li><strong>Functionality Cookies:</strong> These are used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Third-Party Cookies</h2>
                    <p className="text-slate-600 leading-relaxed">
                        In some special cases we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600 mt-4">
                        <li>This site uses Google Analytics for helping us to understand how you use the site and ways that we can improve your experience.</li>
                        <li>We use Supabase for authentication, which may set cookies to manage your session.</li>
                        <li>Razorpay may use cookies to facilitate secure payment transactions.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Managing Cookies</h2>
                    <p className="text-slate-600 leading-relaxed">
                        You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. More Information</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Hopefully that has clarified things for you. If there is something that you aren't sure whether you need or not, it's usually safer to leave cookies enabled in case it does interact with one of the features you use on our site.
                        <br /><br />
                        If you still have questions, you can contact us at <strong>contact@practicekoro.online</strong>.
                    </p>
                </div>
            </section>
        </LegalLayout>
    );
};

export default CookiePolicy;

import LegalLayout from "@/components/legal/LegalLayout";

const PrivacyPolicy = () => {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="January 30, 2026">
            <section className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Welcome to Practice Koro (practicekoro.online). We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our mock test services.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
                    <p className="text-slate-600 mb-4">
                        We collect information that you provide directly to us when you register for an account, subscribe to our services, or communicate with us. This may include:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600">
                        <li><strong>Personal Identifiers:</strong> Name, email address, phone number (WhatsApp number), and profile picture.</li>
                        <li><strong>Account Credentials:</strong> Username and password used for authentication via Supabase.</li>
                        <li><strong>Payment Information:</strong> Transaction details processed through Razorpay (we do not store your credit card or bank details).</li>
                        <li><strong>Usage Data:</strong> Test scores, attempt history, time spent on tests, and analytics data.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
                    <p className="text-slate-600 mb-4">
                        We use the collected information for various purposes, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600">
                        <li>To provide, maintain, and improve our mock test platform.</li>
                        <li>To process your subscription and payments securely through Razorpay.</li>
                        <li>To generate performance reports and personalized recommendations.</li>
                        <li>To send you transactional messages, such as order confirmations and account alerts.</li>
                        <li>To send you updates about new tests, blogs, and promotional offers (you can opt-out at any time).</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
                    <p className="text-slate-600 leading-relaxed">
                        We implement industry-standard security measures to protect your personal information. Your account data is secured through Supabase's robust authentication layer, and all financial transactions are handled by Razorpay, a PCI-DSS compliant payment gateway. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Third-Party Services</h2>
                    <p className="text-slate-600 leading-relaxed">
                        We share your data with trusted third-party service providers only as necessary to provide our services:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600 mt-4">
                        <li><strong>Supabase:</strong> For backend services, database, and authentication.</li>
                        <li><strong>Razorpay:</strong> To process secure payments.</li>
                        <li><strong>Google Analytics:</strong> For understanding website traffic and user behavior.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights</h2>
                    <p className="text-slate-600 leading-relaxed">
                        You have the right to access, update, or delete your personal information. You can manage your profile details directly from your student dashboard. If you wish to delete your account entirely, please contact us at contact@practicekoro.online.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contact Us</h2>
                    <p className="text-slate-600 leading-relaxed">
                        If you have any questions or concerns about this Privacy Policy, please reach out to us:
                    </p>
                    <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-slate-700"><strong>Email:</strong> contact@practicekoro.online</p>
                        <p className="text-slate-700"><strong>Phone:</strong> +91 95477 71118</p>
                        <p className="text-slate-700"><strong>Address:</strong> Sarenga, Bankura, West Bengal, India</p>
                    </div>
                </div>
            </section>
        </LegalLayout>
    );
};

export default PrivacyPolicy;

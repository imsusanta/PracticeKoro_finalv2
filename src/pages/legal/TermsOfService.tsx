import LegalLayout from "@/components/legal/LegalLayout";

const TermsOfService = () => {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="January 30, 2026">
            <section className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
                    <p className="text-slate-600 leading-relaxed">
                        By accessing or using Practice Koro (practicekoro.online), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Use License</h2>
                    <p className="text-slate-600 mb-4">
                        Permission is granted to access the materials (information or software) on Practice Koro's website for personal, non-commercial transitory viewing and educational purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600">
                        <li>Modify or copy the materials (tests, notes, blogs).</li>
                        <li>Use the materials for any commercial purpose, or for any public display.</li>
                        <li>Attempt to decompile or reverse engineer any software contained on the website.</li>
                        <li>Remove any copyright or other proprietary notations from the materials.</li>
                        <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Premium Subscription</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Access to certain features and content on Practice Koro requires a paid subscription. Subscriptions are billed on an annual basis. You agree to provide accurate, complete, and current purchase and account information for all purchases made via the site. Payment is processed through Razorpay.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Account Responsibility</h2>
                    <p className="text-slate-600 leading-relaxed">
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security. Practice Koro will not be liable for any loss or damage arising from your failure to comply with this section.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Disclaimer</h2>
                    <p className="text-slate-600 leading-relaxed">
                        The materials on Practice Koro's website are provided on an 'as is' basis. Practice Koro makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, Practice Koro does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitations</h2>
                    <p className="text-slate-600 leading-relaxed">
                        In no event shall Practice Koro or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Practice Koro's website, even if Practice Koro or a Practice Koro authorized representative has been notified orally or in writing of the possibility of such damage.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Governing Law</h2>
                    <p className="text-slate-600 leading-relaxed">
                        These terms and conditions are governed by and construed in accordance with the laws of West Bengal, India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contact Information</h2>
                    <p className="text-slate-600 leading-relaxed">
                        If you have any questions about these Terms, please contact us at <strong>contact@practicekoro.online</strong>.
                    </p>
                </div>
            </section>
        </LegalLayout>
    );
};

export default TermsOfService;

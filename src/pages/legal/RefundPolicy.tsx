import LegalLayout from "@/components/legal/LegalLayout";

const RefundPolicy = () => {
    return (
        <LegalLayout title="Cancellations & Refunds" lastUpdated="January 30, 2026">
            <section className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Overview</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Practice Koro (practicekoro.online) provides digital services, including mock tests and study materials, on a subscription basis. Since our products are digital goods delivered via Internet download, we generally offer a restrictive refund policy.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Cancellation Policy</h2>
                    <p className="text-slate-600 leading-relaxed">
                        You can cancel your subscription at any time. However, the cancellation will only prevent future automatic renewals (if applicable). No partial refunds will be provided for the remaining period of your current active subscription. To cancel your account or subscription, please contact our support team.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Refund Policy</h2>
                    <p className="text-slate-600 mb-4">
                        Refunds are only considered under the following circumstances:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600">
                        <li><strong>Duplicate Payment:</strong> If you have been charged twice for the same subscription due to a technical error, we will refund the duplicate amount immediately upon verification.</li>
                        <li><strong>Technical Issues:</strong> If you are unable to access the content due to a persistent technical problem on our end that we cannot resolve within 48 hours of being notified.</li>
                        <li><strong>Mistaken Purchase:</strong> If you accidentally purchased a subscription and have NOT accessed any premium content (test or notes) within 24 hours of purchase, you may request a refund.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. No-Refund Scenarios</h2>
                    <p className="text-slate-600 mb-4">
                        Refunds will NOT be provided if:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600">
                        <li>You have already accessed or attempted premium mock tests or notes.</li>
                        <li>You change your mind after using the service.</li>
                        <li>You find the content too difficult or not to your liking.</li>
                        <li>Your account is suspended due to a violation of our Terms of Service.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. How to Request a Refund</h2>
                    <p className="text-slate-600 leading-relaxed">
                        To request a refund, please email us at <strong>contact@practicekoro.online</strong> from your registered email address with the following details:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600 mt-4">
                        <li>Full Name</li>
                        <li>Registered Email/Phone Number</li>
                        <li>Transaction ID (from Razorpay)</li>
                        <li>Date of Purchase</li>
                        <li>Reason for the refund request</li>
                    </ul>
                    <p className="text-slate-600 mt-4">
                        Once your request is received, our team will review it and notify you of the approval or rejection of your refund within 3–5 business days. Approved refunds will be processed through the original payment method (Razorpay) and may take 5–7 business days to reflect in your account.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Contact Support</h2>
                    <p className="text-slate-600 leading-relaxed">
                        For any queries regarding cancellations or refunds, please reach out to:
                        <br />
                        <strong>Email:</strong> contact@practicekoro.online
                        <br />
                        <strong>Phone:</strong> +91 95477 71118
                    </p>
                </div>
            </section>
        </LegalLayout>
    );
};

export default RefundPolicy;

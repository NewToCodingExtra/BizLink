import { Head } from "@inertiajs/react";
import LegalLayout from "../../components/LegalLayout";

export default function SiteTerms() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="October 15, 2026">
      <Head title="Terms of Service" />
      <p>
        These Terms of Service ("Terms") govern your access to and use of <strong>BizLink</strong> 
        ("we", "us", or "our"). By accessing or using our platform, you agree to be bound by these Terms.
      </p>

      <h2>1. Description of Service</h2>
      <p>
        BizLink is an online business-to-business (B2B) platform that connects entrepreneurs, franchise 
        owners, and investors. We provide a space for users to post, discover, and communicate regarding 
        business opportunities. <strong>We are an informational platform only.</strong> We are not a broker, 
        financial advisor, or party to any transaction formed between users.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use BizLink. By registering, you represent that you are of 
        legal age to form a binding contract and that the information you provide is accurate.
      </p>

      <h2>3. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials (including your 
        password or third-party OAuth logins) and for all activities that occur under your account. You 
        must immediately notify us of any unauthorized use of your account.
      </p>

      <h2>4. User-Generated Content</h2>
      <p>
        You retain ownership of the content you post (including text, images, and opportunity details). 
        However, by posting content on BizLink, you grant us a non-exclusive, worldwide, royalty-free 
        license to use, display, and distribute your content for the purpose of operating and promoting 
        the platform.
      </p>
      <p>
        You are solely responsible for the accuracy and legality of the business opportunities you post. 
        You must not post misleading financial claims (e.g., guaranteed ROI).
      </p>

      <h2>5. Moderation and Enforcement</h2>
      <p>
        To keep the marketplace trustworthy, users may report content that violates our Acceptable Use
        Policy. Our administrators review reports and may take action ranging from a warning, to content
        removal, to temporary suspension or a permanent ban. Accounts with repeated violations face
        escalating penalties.
      </p>
      <p>
        The <strong>Verified</strong> badge is issued only after an administrator reviews and approves a
        brand verification request. It is never automatic and may be revoked if the account later
        violates these Terms.
      </p>

      <h2>6. Limitation of Liability and Disclaimer of Warranties</h2>
      <p>
        BizLink is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or
        implied, regarding the platform's reliability, accuracy, or suitability for any purpose. We do
        not verify or endorse the business opportunities posted by users.
      </p>
      <p>
        To the maximum extent permitted by applicable law, BizLink and its owners shall not be liable for 
        any indirect, incidental, special, consequential, or punitive damages, including loss of profits, 
        revenue, or data, resulting from your use of the platform or any interactions/transactions with 
        other users.
      </p>

      <h2>7. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account at our sole discretion, without notice 
        or liability, for any reason, including if you violate these Terms or our Acceptable Use Policy.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the
        <strong> Philippines</strong>, without regard to its conflict of law provisions. Any disputes
        shall be resolved in the competent courts of the Philippines.
      </p>

      <h2>9. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at:
      </p>
      <address className="not-italic text-text-secondary bg-surface p-4 rounded-xl border border-border mt-4">
        <strong>BizLink</strong><br />
        Email: support@bizlink.ph
      </address>
    </LegalLayout>
  );
}


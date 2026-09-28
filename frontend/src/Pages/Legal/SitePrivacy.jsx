import { Head } from "@inertiajs/react";
import LegalLayout from "../../Components/LegalLayout";

export default function SitePrivacy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="September 23, 2026">
      <Head title="Privacy Policy" />
      <p>
        Welcome to <strong>BizLink</strong>. This Privacy Policy explains how we collect, use, 
        disclose, and safeguard your information when you visit our website and use our platform. 
        We respect your privacy and are committed to protecting your personal data in compliance 
        with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Philippines.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        When you create an account and use BizLink to discover or list business opportunities, we collect 
        the following personal information:
      </p>
      <ul>
        <li><strong>Account Data:</strong> Your name, email address, password, role, and profile biography.</li>
        <li><strong>Third-Party Login Data:</strong> If you register using Google or Facebook, we collect your authentication ID and public avatar URL provided by those services.</li>
        <li><strong>User-Generated Content:</strong> Business opportunities, franchise details, images, direct messages with other users, and temporary "stories" that you upload.</li>
        <li><strong>Activity Data:</strong> Which opportunities you "like" or "save" to tailor your experience.</li>
        <li><strong>Technical Data:</strong> Your IP address and User-Agent (browser type) which is collected temporarily for security and session management.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect strictly to operate the platform and facilitate connections:</p>
      <ul>
        <li>To create, manage, and secure your account.</li>
        <li>To allow you to post and manage business and franchise opportunities.</li>
        <li>To enable direct messaging and communication between entrepreneurs.</li>
        <li>To send you transactional emails (like password resets) or important platform notifications.</li>
      </ul>
      <p>
        <strong>We do not sell your personal data.</strong> Because BizLink is a B2B matching platform, 
        some of your profile information (like your name, avatar, and bio) and the opportunities you post 
        will be visible to other registered users.
      </p>

      <h2>3. Cookies and Tracking</h2>
      <p>
        BizLink uses <strong>strictly necessary cookies</strong> required to securely authenticate your 
        login sessions (via Laravel Sanctum). We do not currently use third-party analytics trackers, 
        advertising cookies, or cross-site marketing trackers. If this changes in the future, we will 
        update this policy and request your consent where legally required.
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your personal information only for as long as your account is active or as necessary 
        to provide our services, resolve disputes, and comply with our legal obligations. Expired "stories" 
        are automatically filtered from public view, but their media may be retained in our backups for a limited time.
      </p>

      <h2>5. Your Privacy Rights</h2>
      <p>
        Under the Philippine Data Privacy Act of 2012, you have the right to be informed, object to processing, 
        access, rectify, erase, or block your personal data, as well as the right to data portability.
      </p>
      <p>
        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1 py-0.5 rounded">REQUIRES BUSINESS/LEGAL CONFIRMATION</span>
        <br/>
        To exercise any of these rights, including requesting the <strong>deletion of your account and personal data</strong>, 
        please contact our Data Protection Officer (DPO) at <strong>[PRIVACY CONTACT EMAIL]</strong>. We will respond 
        to your request within the timeframe required by law.
      </p>

      <h2>6. Security</h2>
      <p>
        We implement reasonable and appropriate technical, physical, and organizational security measures to 
        protect your personal information against unauthorized access, alteration, disclosure, or destruction. 
        However, no data transmission over the Internet can be guaranteed to be 100% secure.
      </p>

      <h2>7. Children's Privacy</h2>
      <p>
        BizLink is a business-to-business platform and is not intended for use by children under the age of 18. 
        We do not knowingly collect personal data from minors.
      </p>

      <h2>8. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices or for other 
        operational, legal, or regulatory reasons. We will notify you of any material changes by posting the 
        updated policy on this page and updating the "Last Updated" date.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
      </p>
      <address className="not-italic text-text-secondary bg-surface p-4 rounded-xl border border-border mt-4">
        <strong>[LEGAL BUSINESS NAME]</strong><br />
        [BUSINESS ADDRESS]<br />
        Email: [PRIVACY CONTACT EMAIL]
      </address>
    </LegalLayout>
  );
}


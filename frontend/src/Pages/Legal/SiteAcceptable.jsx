import { Head } from "@inertiajs/react";
import LegalLayout from "../../Components/LegalLayout";

export default function SiteAcceptable() {
  return (
    <LegalLayout title="Acceptable Use Policy" lastUpdated="September 23, 2026">
      <Head title="Acceptable Use Policy" />
      <p>
        This Acceptable Use Policy ("AUP") outlines the rules and guidelines for your use of the 
        <strong>BizLink</strong> platform. By using our platform, you agree to comply with this policy. 
        Violations may result in the suspension or permanent ban of your account.
      </p>

      <h2>1. Prohibited Business Opportunities</h2>
      <p>
        BizLink is designed for legitimate business, franchise, and investment opportunities. 
        You may <strong>NOT</strong> use the platform to post, promote, or solicit:
      </p>
      <ul>
        <li>Multi-Level Marketing (MLM) schemes, pyramid schemes, or Ponzi schemes.</li>
        <li>"Get rich quick" schemes or opportunities guaranteeing unrealistic returns on investment (ROI).</li>
        <li>Businesses involved in illegal activities, adult entertainment, gambling, or unregulated financial services.</li>
        <li>Opportunities that you do not own or do not have explicit authorization to represent.</li>
      </ul>

      <h2>2. Prohibited Content and Behavior</h2>
      <p>
        When posting opportunities, uploading "stories", or sending direct messages to other users, 
        you agree not to:
      </p>
      <ul>
        <li><strong>Spam:</strong> Send unsolicited bulk messages, repeated identical comments, or mass-distribute promotional materials to users who have not expressed interest.</li>
        <li><strong>Harass:</strong> Engage in harassment, hate speech, bullying, or abusive language toward other entrepreneurs.</li>
        <li><strong>Deceive:</strong> Impersonate any person or entity, or falsely state your affiliation with a brand or franchise.</li>
        <li><strong>Infringe:</strong> Upload logos, trademarks, images, or business materials that you do not have the intellectual property rights to use.</li>
      </ul>

      <h2>3. Platform Integrity</h2>
      <p>You may not engage in any activity that compromises the technical integrity of BizLink:</p>
      <ul>
        <li>Do not attempt to scrape, data-mine, or extract user data or opportunity listings using automated bots.</li>
        <li>Do not upload viruses, malware, or malicious attachments via the direct messaging system.</li>
        <li>Do not attempt to bypass our authentication systems or access accounts that do not belong to you.</li>
      </ul>

      <h2>4. Enforcement and Reporting</h2>
      <p>
        We reserve the right, but do not assume the obligation, to monitor content and communications on the platform. 
        We may remove any content or terminate any account that violates this AUP at our sole discretion.
      </p>
      <p>
        If you encounter an opportunity or user that violates this policy, please report it immediately to 
        <strong>[PRIVACY CONTACT EMAIL]</strong>.
      </p>
    </LegalLayout>
  );
}


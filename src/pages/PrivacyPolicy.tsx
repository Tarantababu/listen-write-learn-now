
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PolicyLayout } from '@/components/legal/PolicyLayout';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | lwlnow - Language Learning with Dictation</title>
        <meta name="description" content="Learn how lwlnow collects, uses, and protects your personal information." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <PolicyLayout title="Privacy Policy" lastUpdated="May 7, 2025">
        <h2>Introduction</h2>
        <p>
          At lwlnow ("we", "us", or "our"), we respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you about how we look after your personal data when you visit our website and tell 
          you about your privacy rights and how the law protects you.
        </p>

        <h2>The Data We Collect</h2>
        <p>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul>
          <li><strong>Identity Data</strong>: includes first name, last name, username or similar identifier</li>
          <li><strong>Contact Data</strong>: includes email address</li>
          <li><strong>Technical Data</strong>: includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website</li>
          <li><strong>Usage Data</strong>: includes information about how you use our website and services</li>
          <li><strong>Learning Data</strong>: includes your dictation exercises, vocabulary lists, learning progress, and language preferences</li>
        </ul>

        <h2>How We Use Your Data</h2>
        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
        <ul>
          <li>To provide you with our language learning services</li>
          <li>To personalize your experience and tailor learning content to your needs</li>
          <li>To improve our website and services</li>
          <li>To communicate with you about your account or subscription</li>
          <li>To process payments and manage your subscription</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, 
          or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those 
          employees, agents, contractors, and other third parties who have a business need to know.
        </p>

        <h2>Data Retention</h2>
        <p>
          We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including 
          for the purposes of satisfying any legal, accounting, or reporting requirements.
        </p>

        <h2>Your Legal Rights</h2>
        <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
        <ul>
          <li>Request access to your personal data</li>
          <li>Request correction of your personal data</li>
          <li>Request erasure of your personal data</li>
          <li>Object to processing of your personal data</li>
          <li>Request restriction of processing your personal data</li>
          <li>Request transfer of your personal data</li>
          <li>Right to withdraw consent</li>
        </ul>

        <h2>Third-Party Links</h2>
        <p>
          This website may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling 
          those connections may allow third parties to collect or share data about you. We do not control these third-party websites 
          and are not responsible for their privacy statements.
        </p>

        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page 
          and updating the "Last Updated" date at the top of this policy.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy practices, please contact us at: privacy@lwlnow.com
        </p>
      </PolicyLayout>
    </>
  );
};

export default PrivacyPolicy;

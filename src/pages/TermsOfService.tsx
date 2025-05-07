
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PolicyLayout } from '@/components/legal/PolicyLayout';

const TermsOfService: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | lwlnow - Language Learning with Dictation</title>
        <meta name="description" content="The terms and conditions governing your use of the lwlnow language learning platform." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <PolicyLayout title="Terms of Service" lastUpdated="May 7, 2025">
        <h2>Welcome to lwlnow</h2>
        <p>
          These terms and conditions outline the rules and regulations for the use of lwlnow's website and services.
        </p>
        <p>
          By accessing this website, we assume you accept these terms and conditions. Do not continue to use lwlnow 
          if you do not agree to take all of the terms and conditions stated on this page.
        </p>

        <h2>License</h2>
        <p>
          Unless otherwise stated, lwlnow and/or its licensors own the intellectual property rights for all material on lwlnow. 
          All intellectual property rights are reserved. You may access this from lwlnow for your own personal use subjected to 
          restrictions set in these terms and conditions.
        </p>

        <h3>You must not:</h3>
        <ul>
          <li>Republish material from lwlnow</li>
          <li>Sell, rent, or sub-license material from lwlnow</li>
          <li>Reproduce, duplicate, or copy material from lwlnow</li>
          <li>Redistribute content from lwlnow</li>
        </ul>

        <h2>User Accounts</h2>
        <p>
          When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
          Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the Service and for any activities or actions 
          under your password, whether your password is with our Service or a third-party service.
        </p>

        <h2>Subscriptions</h2>
        <p>
          Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis. 
          Billing cycles are set on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.
        </p>
        <p>
          At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless 
          you cancel it or lwlnow cancels it. You may cancel your Subscription renewal either through your online account management page 
          or by contacting lwlnow customer support team.
        </p>

        <h2>Content</h2>
        <p>
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, 
          or other material. You are responsible for the Content that you post on or through the Service, including its legality, 
          reliability, and appropriateness.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          In no event shall lwlnow, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any 
          indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, 
          use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which lwlnow operates, 
          without regard to its conflict of law provisions.
        </p>

        <h2>Changes</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material 
          we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change 
          will be determined at our sole discretion.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at: terms@lwlnow.com
        </p>
      </PolicyLayout>
    </>
  );
};

export default TermsOfService;

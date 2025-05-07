
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PolicyLayout } from '@/components/legal/PolicyLayout';

const CookiePolicy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Cookie Policy | lwlnow - Language Learning with Dictation</title>
        <meta name="description" content="Information about how lwlnow uses cookies and similar technologies." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <PolicyLayout title="Cookie Policy" lastUpdated="May 7, 2025">
        <h2>What Are Cookies</h2>
        <p>
          As is common practice with almost all professional websites, this site uses cookies, which are tiny files that are 
          downloaded to your computer, to improve your experience. This page describes what information they gather, how we use it, 
          and why we sometimes need to store these cookies. We will also share how you can prevent these cookies from being 
          stored however this may downgrade or 'break' certain elements of the site's functionality.
        </p>

        <h2>How We Use Cookies</h2>
        <p>
          We use cookies for a variety of reasons detailed below. Unfortunately, in most cases there are no industry standard 
          options for disabling cookies without completely disabling the functionality and features they add to this site. 
          It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used 
          to provide a service that you use.
        </p>

        <h2>The Cookies We Set</h2>
        <ul>
          <li>
            <strong>Account related cookies</strong>
            <p>
              If you create an account with us then we will use cookies for the management of the signup process and general 
              administration. These cookies will usually be deleted when you log out however in some cases they may remain 
              afterwards to remember your site preferences when logged out.
            </p>
          </li>
          <li>
            <strong>Login related cookies</strong>
            <p>
              We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in 
              every single time you visit a new page. These cookies are typically removed or cleared when you log out to ensure 
              that you can only access restricted features and areas when logged in.
            </p>
          </li>
          <li>
            <strong>Site preferences cookies</strong>
            <p>
              In order to provide you with a great experience on this site we provide the functionality to set your preferences 
              for how this site runs when you use it. In order to remember your preferences we need to set cookies so that this 
              information can be called whenever you interact with a page is affected by your preferences.
            </p>
          </li>
        </ul>

        <h2>Third Party Cookies</h2>
        <p>
          In some special cases we also use cookies provided by trusted third parties. The following section details which 
          third party cookies you might encounter through this site.
        </p>
        <ul>
          <li>
            <p>
              This site uses Google Analytics which is one of the most widespread and trusted analytics solution on the web for 
              helping us to understand how you use the site and ways that we can improve your experience. These cookies may track 
              things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.
            </p>
            <p>
              For more information on Google Analytics cookies, see the official Google Analytics page.
            </p>
          </li>
          <li>
            <p>
              We also use third-party analytics to track and measure usage of this site so that we can continue to produce engaging 
              content. These cookies may track things such as how long you spend on the site or pages you visit which helps us to 
              understand how we can improve the site for you.
            </p>
          </li>
          <li>
            <p>
              From time to time we test new features and make subtle changes to the way that the site is delivered. When we are 
              still testing new features these cookies may be used to ensure that you receive a consistent experience whilst on 
              the site whilst ensuring we understand which optimizations our users appreciate the most.
            </p>
          </li>
        </ul>

        <h2>More Information</h2>
        <p>
          Hopefully that has clarified things for you and as was previously mentioned if there is something that you aren't 
          sure whether you need or not it's usually safer to leave cookies enabled in case it does interact with one of the 
          features you use on our site.
        </p>
        <p>
          However, if you are still looking for more information then you can contact us through one of our preferred contact methods:
        </p>
        <ul>
          <li>Email: cookies@lwlnow.com</li>
        </ul>
      </PolicyLayout>
    </>
  );
};

export default CookiePolicy;

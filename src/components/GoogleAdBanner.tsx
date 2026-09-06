import React from 'react';
import EthioLearnAppPromoBanner, { EthioLearnAppPromoProps } from './EthioLearnAppPromoBanner';

/**
 * Native in-app promotional showcase banner for EthioLearn Pro.
 * Replaced external Google AdSense scripts with high-converting, ad-free in-house
 * promotions for the Android app, AI Tutor ("አስጎብኚ"), University past exams,
 * and Telegram community.
 */
export default function GoogleAdBanner(props: EthioLearnAppPromoProps) {
  return <EthioLearnAppPromoBanner {...props} />;
}

export { EthioLearnAppPromoBanner };

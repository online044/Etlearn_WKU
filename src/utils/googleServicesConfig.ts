/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Configuration extracted from user-provided google-services.json
 * for the 'etlearn-7b27d' project targeting Etlearn_wku.vercel.app & etlearn2.vercel.app
 */

export const GOOGLE_SERVICES_PROJECT = {
  projectNumber: "782413162967",
  projectId: "etlearn-7b27d",
  storageBucket: "etlearn-7b27d.firebasestorage.app",
  authDomain: "etlearn-7b27d.firebaseapp.com",
  apiKey: "AIzaSyCpPQ9ehHqtdjUo_T6DWXKQNRE5XGMp34c",
  webAppId: "1:782413162967:web:etlearn2prodweb",
  clients: [
    {
      packageName: "Etlearn_wku.vercel.app",
      appId: "1:782413162967:android:1b30a3ba1044293054c392",
      apiKey: "AIzaSyCpPQ9ehHqtdjUo_T6DWXKQNRE5XGMp34c"
    },
    {
      packageName: "etlearn2.vercel.app",
      appId: "1:782413162967:android:4dc7e06fc0b6298554c392",
      apiKey: "AIzaSyCpPQ9ehHqtdjUo_T6DWXKQNRE5XGMp34c"
    }
  ]
};

export const ADMOB_CONFIG = {
  publisherId: 'pub-7081291575190781',
  appId: 'ca-app-pub-7081291575190781~6693490063',
  bannerAdUnitId: 'ca-app-pub-7081291575190781/6293889020',
  adsenseClient: 'ca-pub-7081291575190781',
  adsenseBannerSlot: '6112187514'
} as const;

export default GOOGLE_SERVICES_PROJECT;

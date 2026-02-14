import { createI18n } from 'vue-i18n'
import { getCookie } from '../utils/cookie'
import en from './locales/en.json'
import zhTW from './locales/zh-TW.json'
import ja from './locales/ja.json'

const savedLocale = getCookie('locale') || 'zh-TW'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-TW': zhTW,
    ja,
  },
})

export default i18n

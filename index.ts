import {useLocalStorage, useSessionStorage, UseStorageOptions} from "@vueuse/core";
import {toRefs} from 'vue'
import CryptoJS from 'crypto-js';

let storeKey = ''

export type Data = {[key: string]: any}

interface Option extends UseStorageOptions<Data> {
  crypto?: boolean;
}

export function createStore(key: string='please-assign-value', options?: Option) {
  storeKey = key
  const initOptions: UseStorageOptions<Data> = {}
  if (options?.crypto) {
    initOptions.serializer = {
      read: (v: any) => v ? JSON.parse(decrypt(v)) : null,
      write: (v: any) => encrypt(JSON.stringify(v)),
    }
  }
  const storeLocalStorage = useLocalStorage<Data>(key, {}, {...initOptions, ...options})
  const storeSessionStorage = useSessionStorage<Data>(key, {}, {...initOptions, ...options})
  return {
    useLocalStorage: (key: string, initialValue: any) => {
      const store = storeLocalStorage
      store.value = {...store.value, [key]: store.value[key] || initialValue }
      return toRefs(store.value)[key]!
    },
    useSessionStorage: (key: string, initialValue: any) => {
      const store = storeSessionStorage
      store.value = {...store.value, [key]: store.value[key] || initialValue }
      return toRefs(store.value)[key]!
    }
  }
}

export const decrypt = (data: any) => {
  const key = CryptoJS.MD5(storeKey).toString();
  const iv = key.substring(0, 16);

  const decrypted = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return CryptoJS.enc.Utf8.stringify(decrypted);
};

export const encrypt = (data: any) => {
  const key = CryptoJS.MD5(storeKey).toString();
  const iv = key.substring(0, 16);

  const content = CryptoJS.enc.Utf8.parse(data);
  const encrypted = CryptoJS.AES.encrypt(content, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.toString();
};

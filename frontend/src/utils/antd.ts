/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';

let messageInstance: MessageInstance = {
  success: (content: any) => { console.log('success', content); return {} as any; },
  error: (content: any) => { console.log('error', content); return {} as any; },
  info: (content: any) => { console.log('info', content); return {} as any; },
  warning: (content: any) => { console.log('warning', content); return {} as any; },
  loading: (content: any) => { console.log('loading', content); return {} as any; },
} as any;

let notificationInstance: NotificationInstance = {
  success: (config: any) => { console.log('success', config); return {} as any; },
  error: (config: any) => { console.log('error', config); return {} as any; },
  info: (config: any) => { console.log('info', config); return {} as any; },
  warning: (config: any) => { console.log('warning', config); return {} as any; },
  open: (config: any) => { console.log('open', config); return {} as any; },
} as any;

let modalInstance: any = {} as any;

export const setAntdStatic = (
  msg: MessageInstance,
  notif: NotificationInstance,
  mod: any
) => {
  messageInstance = msg;
  notificationInstance = notif;
  modalInstance = mod;
};

export const message: MessageInstance = {
  success: (...args: any[]) => (messageInstance as any).success(...args),
  error: (...args: any[]) => (messageInstance as any).error(...args),
  info: (...args: any[]) => (messageInstance as any).info(...args),
  warning: (...args: any[]) => (messageInstance as any).warning(...args),
  loading: (...args: any[]) => (messageInstance as any).loading(...args),
} as any;

export const notification: NotificationInstance = {
  success: (...args: any[]) => (notificationInstance as any).success(...args),
  error: (...args: any[]) => (notificationInstance as any).error(...args),
  info: (...args: any[]) => (notificationInstance as any).info(...args),
  warning: (...args: any[]) => (notificationInstance as any).warning(...args),
  open: (...args: any[]) => (notificationInstance as any).open(...args),
} as any;

export const modal: any = {
  confirm: (...args: any[]) => (modalInstance as any).confirm?.(...args),
  info: (...args: any[]) => (modalInstance as any).info?.(...args),
  success: (...args: any[]) => (modalInstance as any).success?.(...args),
  error: (...args: any[]) => (modalInstance as any).error?.(...args),
  warning: (...args: any[]) => (modalInstance as any).warning?.(...args),
};

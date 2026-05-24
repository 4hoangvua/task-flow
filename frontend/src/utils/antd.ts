/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';

let message: MessageInstance = {
  success: (content: any) => {
    console.log('success', content);
    return {} as any;
  },
  error: (content: any) => {
    console.log('error', content);
    return {} as any;
  },
  info: (content: any) => {
    console.log('info', content);
    return {} as any;
  },
  warning: (content: any) => {
    console.log('warning', content);
    return {} as any;
  },
  loading: (content: any) => {
    console.log('loading', content);
    return {} as any;
  },
} as any;

let notification: NotificationInstance = {} as any;
let modal: any = {} as any;

export const setAntdStatic = (
  msg: MessageInstance,
  notif: NotificationInstance,
  mod: any
) => {
  message = msg;
  notification = notif;
  modal = mod;
};

export { message, notification, modal };

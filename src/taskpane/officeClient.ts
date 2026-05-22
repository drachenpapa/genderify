type OfficeTextAsyncResult = Office.AsyncResult<string>;
type OfficeSetAsyncResult = Office.AsyncResult<void>;

export function getSelectedText(hostType: Office.HostType | null): Promise<OfficeTextAsyncResult> {
  return new Promise((resolve, reject) => {
    if (hostType === Office.HostType.Outlook) {
      const body = Office.context.mailbox?.item?.body;
      if (!body) {
        reject(new Error("Outlook-Kontext ist nicht verfügbar."));
        return;
      }

      body.getAsync(Office.CoercionType.Text, (asyncResult) => resolve(asyncResult));
      return;
    }

    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (asyncResult) => resolve(asyncResult));
  });
}

export function setSelectedText(hostType: Office.HostType | null, updatedText: string): Promise<OfficeSetAsyncResult> {
  return new Promise((resolve, reject) => {
    if (hostType === Office.HostType.Outlook) {
      const body = Office.context.mailbox?.item?.body;
      if (!body) {
        reject(new Error("Outlook-Kontext ist nicht verfügbar."));
        return;
      }

      body.setAsync(updatedText, (asyncResult) => resolve(asyncResult));
      return;
    }

    Office.context.document.setSelectedDataAsync(updatedText, (asyncResult) => resolve(asyncResult));
  });
}

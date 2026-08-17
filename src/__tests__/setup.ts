// Set up the Office global before any test module is loaded,
// so that Office.onReady() in genderify.ts doesn't throw.
(global as any).Office = {
  onReady: (callback: (info: { host: string }) => void) => callback({ host: "Word" }),
  context: {
    document: {
      getSelectedDataAsync: () => {},
      setSelectedDataAsync: () => {},
    },
    mailbox: { item: { body: { getAsync: () => {} } } },
  },
  CoercionType: { Text: "Text" },
  HostType: { Word: "Word", Excel: "Excel", PowerPoint: "PowerPoint", Outlook: "Outlook" },
  AsyncResultStatus: { Succeeded: "succeeded" },
};

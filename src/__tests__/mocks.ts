const mockOffice = {
    onReady: jest.fn((callback) => callback({ host: "Word" })),
    context: {
        document: {
            getSelectedDataAsync: jest.fn((coercionType, callback) => {
                callback({ status: "succeeded", value: "This is a test sentence with a gendered word." });
            }),
            setSelectedDataAsync: jest.fn((text, callback) => {
                callback({ status: "succeeded" });
            }),
        },
        mailbox: {
            item: {
                body: {
                    getAsync: jest.fn((coercionType, callback) => {
                        callback({ status: "succeeded", value: "This is a test sentence with a gendered word." });
                    }),
                },
            },
        },
    },
    CoercionType: {
        Text: "Text",
    },
    HostType: {
        Word: "Word",
        Excel: "Excel",
        PowerPoint: "PowerPoint",
        Outlook: "Outlook",
    },
    AsyncResultStatus: {
        Succeeded: "succeeded",
    }
};

export default mockOffice;

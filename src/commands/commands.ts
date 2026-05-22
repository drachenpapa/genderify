/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global Office */

const ACTION_NOTIFICATION_ID = "ActionPerformanceNotification";

Office.onReady(() => {
  // Office.js is ready.
});

function showInfoNotification(message: string): void {
  const notification: Office.NotificationMessageDetails = {
    type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
    message,
    icon: "Icon.80x80",
    persistent: false,
  };

  Office.context.mailbox?.item?.notificationMessages?.replaceAsync(ACTION_NOTIFICATION_ID, notification);
}

/**
 * Handles ribbon command execution.
 */
function action(event: Office.AddinCommands.Event): void {
  try {
    showInfoNotification("Genderify ist bereit.");
  } finally {
    // Always complete, even if mailbox context is not available.
    event.completed();
  }
}

Office.actions.associate("action", action);

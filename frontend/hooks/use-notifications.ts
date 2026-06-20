"use client";

import { useState } from "react";

/**
 * useNotifications hook - Notifications are currently disabled.
 * This is a placeholder to prevent build errors after removing Firebase.
 */
export function useNotifications() {
  const [permission] = useState<string>("denied");
  const [loading] = useState(false);

  const setupFirebaseMessaging = async () => {
    // Notifications are disabled
    return;
  };

  const handleRequestPermission = async () => {
    // Notifications are disabled
    return;
  };

  return { 
    permission, 
    handleRequestPermission, 
    loading, 
    refreshSetup: setupFirebaseMessaging 
  };
}

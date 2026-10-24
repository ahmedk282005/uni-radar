import { Share } from "react-native";

import type { Group } from "./types";

// Opens the phone's share menu (WhatsApp, Signal, …) with the invite code.
export async function shareInvite(group: Group): Promise<void> {
  try {
    await Share.share({
      message: `Join my group "${group.name}" on Uni Radar with the invite code ${group.inviteCode}`,
    });
  } catch {
    // Nothing to tell the user: the code is shown on screen and can be typed instead.
  }
}

import type { FindingType } from "./types";

export interface AppState {
  findings: FindingType[];
  currentIndex: number;
  hostType: Office.HostType | null;
}

export const state: AppState = {
  findings: [],
  currentIndex: 0,
  hostType: null,
};

export const findings = (): FindingType[] => state.findings;

export function setHostType(hostType: Office.HostType | null): void {
  state.hostType = hostType;
}

export function setFindings(nextFindings: FindingType[]): void {
  state.findings = nextFindings;
  state.currentIndex = 0;
}

export function getCurrentFinding(): FindingType | undefined {
  return state.findings[state.currentIndex];
}

export function removeCurrentFinding(): boolean {
  if (state.findings.length === 0) {
    return true;
  }

  state.findings.splice(state.currentIndex, 1);
  if (state.findings.length === 0) {
    state.currentIndex = 0;
    return true;
  }

  state.currentIndex = Math.min(state.currentIndex, state.findings.length - 1);
  return false;
}

export function moveToPreviousFinding(): boolean {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    return true;
  }

  return false;
}

export function moveToNextFinding(): boolean {
  if (state.currentIndex < state.findings.length - 1) {
    state.currentIndex++;
    return true;
  }

  return false;
}

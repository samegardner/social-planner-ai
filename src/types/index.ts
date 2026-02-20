export interface OnboardingState {
  zipCode: string;
  activities: string[];
  hardNos: string;
  socialFrequency: number;
  availability: string[];
  friends: { name: string; phoneNumber: string }[];
  email: string;
  imessageNumber?: string;
}

export interface Friend {
  id: number;
  name: string;
  phoneNumber: string;
  createdAt: string | null;
}

export interface PreferencesResponse extends OnboardingState {
  onboardingCompleted: boolean;
}

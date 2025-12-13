import * as Linking from "expo-linking";

export const linking = {
  prefixes: [
    Linking.createURL("/"),  // exp://... (dev)
    "sitrixx://",            // production scheme
  ],
  config: {
    screens: {
      ResetPassword: "reset-password",
    },
  },
};

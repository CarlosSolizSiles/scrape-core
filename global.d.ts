// src/global.d.ts

declare global {
  namespace NodeJS {
    interface Global {
      appState: {
        browser?: any;
        database?: any;
      };
    }
  }

  var appState: {
    browser?: any;
    database?: any;
  };
}

export {};
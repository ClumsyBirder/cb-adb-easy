import { useState, useEffect } from "react";

export function usePythonState(propName: string) {
  const [propValue, setPropValue] = useState();

  useEffect(() => {
    window.addEventListener("pywebviewready", function () {
      if (!window.pywebview.state) {
        window.pywebview.state = {};
      }
      window.pywebview.state[`set_${propName}`] = setPropValue;
    });
  }, []);
  return propValue;
}

export function usePythonApi(apiName: string, apiContent: any) {
  window.pywebview.api = window.pywebview.api || {};
  window.pywebview.api[apiName](apiContent);
}

export type PromptRenderVariables = Readonly<Record<string, string>>;

export type PromptRenderInput = {
  template: string;
  variables: PromptRenderVariables;
};

export type PromptRenderResult = {
  content: string;
};

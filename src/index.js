import OpenAI from "openai"

const client = new OpenAI()

const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: "give me a joke",
});

console.log(response.output_text);

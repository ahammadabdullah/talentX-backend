import axios from "axios";

export interface JobDescriptionParams {
  title: string;
  companyName: string;
  techStack: string[];
}

export const generateJobDescription = async (
  params: JobDescriptionParams
): Promise<string> => {
  try {
    const { title, companyName, techStack } = params;

    // If no OpenAI API key is configured, return a template description
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not configured, using template description");
      return generateTemplateDescription(params);
    }

    const prompt = `Generate a professional job description for the following position:

Title: ${title}
Company: ${companyName}
Tech Stack: ${techStack.join(", ")}

Requirements:
- Write in a professional, engaging tone
- Include responsibilities, requirements, and benefits
- Keep it between 150-300 words
- Focus on the specific technologies mentioned
- Make it appealing to talented developers

Do not include salary information, application instructions, or company-specific details beyond the company name provided.`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    const generatedDescription =
      response.data.choices[0]?.message?.content?.trim();

    if (!generatedDescription) {
      console.warn("OpenAI returned empty description, using template");
      return generateTemplateDescription(params);
    }

    return generatedDescription;
  } catch (error) {
    console.error("Error generating job description with AI:", error);
    console.log("Falling back to template description");
    return generateTemplateDescription(params);
  }
};

const generateTemplateDescription = (params: JobDescriptionParams): string => {
  const { title, companyName, techStack } = params;

  return `Join our team at ${companyName} as a ${title}! We're looking for a talented developer to work with our modern tech stack including ${techStack.join(
    ", "
  )}.

Key Responsibilities:
• Develop and maintain high-quality software applications
• Collaborate with cross-functional teams to deliver innovative solutions
• Write clean, maintainable, and efficient code
• Participate in code reviews and technical discussions
• Stay up-to-date with the latest technologies and best practices

Requirements:
• Strong experience with ${techStack.slice(0, 3).join(", ")}
• Excellent problem-solving and communication skills
• Experience with modern development practices and tools
• Ability to work in a fast-paced, collaborative environment

What We Offer:
• Competitive compensation package
• Flexible working arrangements
• Professional development opportunities
• Modern tech stack and tools
• Collaborative and inclusive work environment

Ready to take your career to the next level? We'd love to hear from you!`;
};

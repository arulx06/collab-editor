export const templates = [
  {
    id: "blank",
    label: "Blank Document",
    imageUrl: "/blank-document.svg",
  },
  {
    id: "software-proposal",
    label: "Software Development Proposal",
    imageUrl: "/software-proposal.svg",
    initialContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1 style="text-align:center; margin-bottom: 20px;">Software Development Proposal</h1>
        
        <h2 style="margin-top: 24px;">Project Overview</h2>
        <p>
          We propose to develop an innovative software solution tailored
          to support business goals, improve productivity,
          and ensure scalable long-term performance.
        </p>

        <h2 style="margin-top: 24px;">Objectives</h2>
        <ul>
          <li>Design a scalable architecture</li>
          <li>Create an intuitive user experience</li>
          <li>Meet timeline and budget expectations</li>
        </ul>

        <h2 style="margin-top: 24px;">Deliverables</h2>
        <ol>
          <li>Requirement Documentation</li>
          <li>Design Prototypes</li>
          <li>Development & Testing</li>
          <li>Deployment & Maintenance</li>
        </ol>

        <h2 style="margin-top: 24px;">Success Metrics</h2>
        <ul>
          <li>Reduced operational complexity</li>
          <li>Faster task completion</li>
          <li>Improved customer engagement</li>
        </ul>
      </div>
    `,
  },
  {
    id: "project-proposal",
    label: "Project Proposal",
    imageUrl: "/project-proposal.svg",
    initialContent: `
      <div style="font-family: Arial; line-height: 1.5;">
        <h1 style="text-align:center;">Project Proposal</h1>

        <h3>Project Title</h3>
        <p><strong>Innovative Solutions for [Project Goal]</strong></p>

        <h3>Summary</h3>
        <p>
          This project is focused on addressing [key challenge] with a
          strategic and sustainable approach.
        </p>

        <h3>Timeline</h3>
        <table border="1" cellspacing="0" cellpadding="8" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>Phase</th>
            <th>Time</th>
          </tr>
          <tr>
            <td>Planning</td>
            <td>2 Weeks</td>
          </tr>
          <tr>
            <td>Execution</td>
            <td>6 Weeks</td>
          </tr>
          <tr>
            <td>Testing</td>
            <td>2 Weeks</td>
          </tr>
        </table>

        <h3>Budget</h3>
        <p>Estimated total cost: <strong>$[amount]</strong></p>
      </div>
    `,
  },
  {
    id: "business-letter",
    label: "Business Letter",
    imageUrl: "/business-letter.svg",
    initialContent: `
      <div style="font-family: 'Times New Roman'; font-size: 15px;">
        <p>[Your Name]<br>
        [Your Position]<br>
        [Company Name]<br>
        [Email] • [Phone]<br><br>
        [Date]</p>

        <p>[Recipient Name]<br>
        [Recipient Title]<br>
        [Company Name]</p><br>

        <p>Dear [Recipient Name],</p>
        <p>
          I am writing to discuss [purpose of communication].
          We value this opportunity and look forward to a productive partnership.
        </p>
        <p>
          Please feel free to reach out for any additional clarification.
        </p>

        <br>
        <p>Sincerely,<br><br>
        <strong>[Your Name]</strong></p>
      </div>
    `,
  },
  {
    id: "resume",
    label: "Resume",
    imageUrl: "/resume.svg",
    initialContent: `
      <div style="font-family: Arial; line-height: 1.4;">
        <h1 style="text-align:center; font-size: 32px;">[YOUR NAME]</h1>
        <p style="text-align:center;">
          [Phone] • [Email] • [LinkedIn] • [Portfolio]
        </p>
        <hr style="margin: 18px 0;">

        <h2>Professional Summary</h2>
        <p>
          Dedicated and results-driven professional with expertise
          in delivering high-impact solutions and improving business processes.
        </p>

        <h2>Experience</h2>
        <p><strong>[Job Title]</strong> – [Company] | [Year–Year]</p>
        <ul>
          <li>Achievement or responsibility example</li>
          <li>Achievement or responsibility example</li>
        </ul>

        <h2>Education</h2>
        <p><strong>[Degree]</strong> — [University], [Year]</p>

        <h2>Skills</h2>
        <ul>
          <li>Skill 1</li>
          <li>Skill 2</li>
          <li>Skill 3</li>
        </ul>
      </div>
    `,
  },
  {
    id: "cover-letter",
    label: "Cover Letter",
    imageUrl: "/cover-letter.svg",
    initialContent: `
      <div style="font-family: Georgia;">
        <p>[Your Name]<br>[Your Email] • [Phone]<br>[Date]</p>

        <p>[Hiring Manager Name]<br>[Company Name]</p><br>

        <p>Dear [Hiring Manager],</p>
        <p>
          I am excited to apply for the position of
          <strong>[Job Title]</strong> at <strong>[Company Name]</strong>.
          My skills in [relevant skill] make me a strong fit for the role.
        </p>

        <p>
          I look forward to the opportunity to contribute
          and grow with your organization.
        </p>

        <p>Sincerely,<br><br>
        <strong>[Your Name]</strong></p>
      </div>
    `,
  },
  {
    id: "letter",
    label: "Letter",
    imageUrl: "/letter.svg",
    initialContent: `
      <div style="font-family: 'Times New Roman';">
        <p>[Your Name]<br>[City, ZIP]<br>[Date]</p>

        <p>Dear [Recipient],</p>

        <p>
          I hope you are doing well. I wanted to reach out and share something
          important with you today.
        </p>

        <p>
          Looking forward to hearing from you soon.
        </p>

        <p>Warm regards,<br><br>
        [Your Name]</p>
      </div>
    `,
  },
];

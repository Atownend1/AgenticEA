import { createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";

// Setup Notion databases for meeting automation
export async function setupNotionDatabases() {
  // Create Meetings database
  await createDatabaseIfNotExists("Meetings", {
    Title: {
      title: {}
    },
    Date: {
      date: {}
    },
    Duration: {
      number: {
        format: "number"
      }
    },
    Attendees: {
      multi_select: {
        options: []
      }
    },
    Status: {
      select: {
        options: [
          { name: "Processing", color: "yellow" },
          { name: "Completed", color: "green" },
          { name: "Failed", color: "red" }
        ]
      }
    },
    "Fireflies ID": {
      rich_text: {}
    },
    Summary: {
      rich_text: {}
    },
    "Key Topics": {
      multi_select: {
        options: []
      }
    },
    Outcomes: {
      rich_text: {}
    },
    Takeaways: {
      rich_text: {}
    },
    "Next Steps": {
      rich_text: {}
    },
    "Action Items Count": {
      number: {
        format: "number"
      }
    }
  });

  // Create Action Items database
  await createDatabaseIfNotExists("Action Items", {
    Title: {
      title: {}
    },
    Description: {
      rich_text: {}
    },
    Assignee: {
      rich_text: {}
    },
    "Assignee Email": {
      email: {}
    },
    "Due Date": {
      date: {}
    },
    Status: {
      select: {
        options: [
          { name: "Pending", color: "gray" },
          { name: "In Progress", color: "blue" },
          { name: "Completed", color: "green" },
          { name: "Overdue", color: "red" }
        ]
      }
    },
    Priority: {
      select: {
        options: [
          { name: "High", color: "red" },
          { name: "Medium", color: "yellow" },
          { name: "Low", color: "green" }
        ]
      }
    },
    "Meeting Title": {
      rich_text: {}
    },
    Deliverable: {
      rich_text: {}
    },
    "Completed Date": {
      date: {}
    }
  });

  console.log("Notion databases setup completed successfully!");
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupNotionDatabases()
    .then(() => {
      console.log("Setup complete!");
      process.exit(0);
    })
    .catch(error => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

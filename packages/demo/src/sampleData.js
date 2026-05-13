export const sampleJson = JSON.stringify({
  company: {
    name: "Acme Corp",
    founded: "1985-03-15",
    lastUpdated: "2024-11-05T09:42:00Z",
    syncedAt: 1730793720,
    active: true,
    revenue: 4800000,
    growthRate: 12.5,
    headquarters: {
      city: "New York",
      country: "USA",
      zip: "10001"
    },
    departments: [
      { id: 1, name: "Engineering", headcount: 42, budget: 2000000, active: true  },
      { id: 2, name: "Marketing",   headcount: 18, budget: 800000,  active: true  },
      { id: 3, name: "Sales",       headcount: 31, budget: 1500000, active: true  },
      { id: 4, name: "HR",          headcount: 9,  budget: 400000,  active: false }
    ],
    products: [
      {
        id: "P001",
        name: "Widget Pro",
        launchDate: "2022-06-01",
        listedAt: 1654041600,
        inStock: true,
        price: 299.99,
        tags: ["hardware", "flagship", "popular"],
        specs: { weight: "1.2kg", dimensions: "30x20x10cm", color: "black" },
        supplier: { name: "Acme Parts Co", country: "USA", contact: "parts@acme.com" }
      },
      {
        id: "P002",
        name: "Gadget Lite",
        launchDate: "2023-11-15",
        listedAt: 1699920000,
        inStock: false,
        price: 49.99,
        tags: ["software", "entry-level"],
        specs: { platform: "web", license: "SaaS", seats: 100 },
        supplier: { name: "CloudVendor Inc", country: "Canada", contact: "sales@cloudvendor.ca" }
      }
    ]
  }
}, null, 2);
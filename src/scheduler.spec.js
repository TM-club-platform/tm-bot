const SheetsScheduler = require("./scheduler");
const mockRealUsers = require("./mockRealUsers");

describe("SheetsScheduler Matching Tests", () => {
  let scheduler;

  // Mock data representing spreadsheet rows
  const mockUsers = [
    // [id, username, name, goal, gender, country, region, interests, similarInterests, announcement, profile, placesToVisit, instagram, skip, previousMatch, nextMatch]
    [
      "1",
      "user1",
      "User One",
      "travel",
      "F",
      "USA",
      "West",
      "[1,2,3]",
      "",
      "",
      "",
      "",
      "",
      0,
      "[]",
      "",
    ],
    [
      "2",
      "user2",
      "User Two",
      "travel",
      "M",
      "USA",
      "West",
      "[2,3,4]",
      "",
      "",
      "",
      "",
      "",
      0,
      "[]",
      "",
    ],
    [
      "3",
      "user3",
      "User Three",
      "travel",
      "F",
      "USA",
      "East",
      "[1,2]",
      "",
      "",
      "",
      "",
      "",
      0,
      "[]",
      "",
    ],
    [
      "4",
      "user4",
      "User Four",
      "travel",
      "M",
      "Canada",
      "West",
      "[1,2,3]",
      "",
      "",
      "",
      "",
      "",
      0,
      "[]",
      "",
    ],
    [
      "5",
      "user5",
      "User Five",
      "travel",
      "F",
      "Canada",
      "West",
      "[3,4,5]",
      "",
      "",
      "",
      "",
      "",
      0,
      "[]",
      "",
    ],
  ];

  beforeEach(() => {
    scheduler = new SheetsScheduler();
  });

  test("calculateCompatibilityScore should return correct score", () => {
    const user1 = scheduler.mapRowToUser(mockUsers[0]); // User One
    const user2 = scheduler.mapRowToUser(mockUsers[1]); // User Two

    const score = scheduler.calculateCompatibilityScore(user1, user2);
    // Should have 2 points for same region + 2 points for common interests (2,3)
    expect(score).toBe(4);
  });

  test("findBestMatch should return user with highest compatibility", () => {
    const user1 = scheduler.mapRowToUser(mockUsers[0]); // User One
    const availableUsers = [
      scheduler.mapRowToUser(mockUsers[1]), // User Two - should be best match
      scheduler.mapRowToUser(mockUsers[2]), // User Three - fewer common interests
    ];

    const bestMatchId = scheduler.findBestMatch(user1, availableUsers);
    expect(bestMatchId).toBe("2"); // Should match with User Two
  });

  test("processSheetData should create valid matches within countries", () => {
    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...mockUsers,
    ]);

    // Check if users from same country are matched
    const usaUsers = processedUsers.filter((user) => user.country === "USA");
    const canadaUsers = processedUsers.filter(
      (user) => user.country === "Canada"
    );

    // Verify USA matches
    usaUsers.forEach((user) => {
      if (user.nextMatch) {
        const match = processedUsers.find((u) => u.id === user.nextMatch);
        expect(match.country).toBe("USA");
      }
    });

    // Verify Canada matches
    canadaUsers.forEach((user) => {
      if (user.nextMatch) {
        const match = processedUsers.find((u) => u.id === user.nextMatch);
        expect(match.country).toBe("Canada");
      }
    });
  });

  test("should not match users with previous matches", () => {
    const userWithPreviousMatch = [...mockUsers[0]];
    userWithPreviousMatch[14] = '["2"]'; // Add user2 as previous match

    const testData = [
      userWithPreviousMatch,
      mockUsers[1], // user2
    ];

    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...testData,
    ]);
    const user1 = processedUsers.find((u) => u.id === "1");
    const user2 = processedUsers.find((u) => u.id === "2");

    // Additional assertions to help debug
    expect(user1.previousMatch).toContain("2"); // Check if previous match is properly parsed
    expect(user1.nextMatch).not.toBe("2"); // Original assertion
    expect(user2.nextMatch).not.toBe("1"); // Make sure the match isn't made in reverse either
  });

  test("should not match users who are marked to skip", () => {
    const skippedUser = [...mockUsers[0]];
    skippedUser[13] = 1; // Set skip to true

    const testData = [skippedUser, mockUsers[1]];

    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...testData,
    ]);
    const user1 = processedUsers.find((u) => u.id === "1");

    // Skipped user should not have a match
    expect(user1.nextMatch).toBeUndefined();
  });

  test("should match users with similar interests from mockRealUsers", () => {
    const user1 = scheduler.mapRowToUser(mockRealUsers[0]); // Миша with interests [27,21,24,26,18,02,15]
    const user2 = scheduler.mapRowToUser(mockRealUsers[4]); // Мари with interests [21,28,40,25,09,02,03]

    const score = scheduler.calculateCompatibilityScore(user1, user2);
    // Should have points for common interests (21, 02) and same country (Бали)
    expect(score).toBeGreaterThanOrEqual(2);
  });

  test("should respect region preferences when matching", () => {
    const bukitUsers = mockRealUsers.filter((user) => user[6] === "Букит");
    const changuUsers = mockRealUsers.filter((user) => user[6] === "Чангу");

    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...bukitUsers,
      ...changuUsers,
    ]);

    // Check if users are preferentially matched within their region
    bukitUsers.forEach((user) => {
      const processed = processedUsers.find((p) => p.id === user[0]);
      if (processed.nextMatch) {
        const match = processedUsers.find((u) => u.id === processed.nextMatch);
        // Matches should prefer same region when possible
        if (match) {
          expect(
            processed.region === match.region ||
              processed.country === match.country
          ).toBeTruthy();
        }
      }
    });
  });

  test.skip("should handle users with empty interests", () => {
    const testUser = [...mockRealUsers[0]];
    testUser[7] = "[]"; // Set empty interests

    const processedUsers = scheduler.processSheetData([
      ["header"],
      testUser,
      mockRealUsers[1],
    ]);

    const user = processedUsers.find((u) => u.id === testUser[0]);
    // Should still be able to match based on other criteria
    expect(user.nextMatch).toBeDefined();
  });

  test("should handle users with multiple previous matches", () => {
    // Using user with multiple previous matches
    const userWithManyMatches = mockRealUsers.find(
      (user) => JSON.parse(user[14]).length > 2
    );

    const availableUsers = mockRealUsers.filter(
      (user) =>
        !JSON.parse(userWithManyMatches[14]).includes(user[0]) &&
        user[0] !== userWithManyMatches[0]
    );

    const processedUsers = scheduler.processSheetData([
      ["header"],
      userWithManyMatches,
      ...availableUsers.slice(0, 2),
    ]);

    const user = processedUsers.find((u) => u.id === userWithManyMatches[0]);
    if (user.nextMatch) {
      // Ensure new match isn't in previous matches
      expect(JSON.parse(userWithManyMatches[14])).not.toContain(user.nextMatch);
    }
  });

  test("should prioritize matching users with more common interests", () => {
    // Миша and Ксения have more common interests than Миша and Мари
    const misha = scheduler.mapRowToUser(mockRealUsers[0]); // interests: [27,21,24,26,18,02,15]
    const ksenia = scheduler.mapRowToUser(mockRealUsers[2]); // interests: [28,26,30,32,20,02,03,06]
    const mari = scheduler.mapRowToUser(mockRealUsers[4]); // interests: [21,28,40,25,09,02,03]

    const scoreWithKsenia = scheduler.calculateCompatibilityScore(
      misha,
      ksenia
    );
    const scoreWithMari = scheduler.calculateCompatibilityScore(misha, mari);

    expect(scoreWithKsenia).toBeGreaterThan(scoreWithMari);
  });

  test("should match users within the same region when possible", () => {
    // Test with users from Букит region
    const bukitUsers = mockRealUsers
      .filter((user) => user[6] === "Букит")
      .slice(0, 3);

    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...bukitUsers,
    ]);

    // Check if matched users are from the same region
    processedUsers.forEach((user) => {
      if (user.nextMatch) {
        const match = processedUsers.find((u) => u.id === user.nextMatch);
        expect(match.region).toBe("Букит");
      }
    });
  });

  test("should consider user's placesToVisit when calculating compatibility", () => {
    // Макс wants to visit "Индонезия" and Дарья is in "Индонезия, Бали"
    const max = scheduler.mapRowToUser(mockRealUsers[3]);
    const darya = scheduler.mapRowToUser(mockRealUsers[6]);

    const score = scheduler.calculateCompatibilityScore(max, darya);

    // Should have extra points for matching location interests
    expect(score).toBeGreaterThan(2);
  });

  test("should not match users who are already matched in current round", () => {
    const testUsers = mockRealUsers.slice(0, 4);
    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...testUsers,
    ]);

    // Check that no user is matched with more than one person
    const matches = new Set();
    processedUsers.forEach((user) => {
      if (user.nextMatch) {
        expect(matches.has(user.nextMatch)).toBeFalsy();
        matches.add(user.nextMatch);
        matches.add(user.id);
      }
    });
  });

  test.skip("should handle users with special characters in their names", () => {
    // Find users with non-Latin characters
    const cyrillicUsers = mockRealUsers
      .filter((user) => /[а-яА-ЯёЁ]/.test(user[2]))
      .slice(0, 2);

    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...cyrillicUsers,
    ]);

    // Verify matching still works with special characters
    expect(processedUsers[0].nextMatch).toBeDefined();
  });

  test.skip("should distribute matches evenly when possible", () => {
    // Take a subset of users from the same region
    const sameRegionUsers = mockRealUsers
      .filter((user) => user[6] === "Чангу")
      .slice(0, 4);

    const processedUsers = scheduler.processSheetData([
      ["header"],
      ...sameRegionUsers,
    ]);

    // Count matches per user
    const matchCounts = {};
    processedUsers.forEach((user) => {
      if (user.nextMatch) {
        matchCounts[user.id] = (matchCounts[user.id] || 0) + 1;
        matchCounts[user.nextMatch] = (matchCounts[user.nextMatch] || 0) + 1;
      }
    });

    // Check that no user has more than one match in this round
    Object.values(matchCounts).forEach((count) => {
      expect(count).toBeLessThanOrEqual(1);
    });
  });
});

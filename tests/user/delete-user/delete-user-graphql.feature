Feature: Delete a user via GraphQL

  @user
  Scenario: I can delete a user
    Given user profile data
      | email              | country | street      | postalCode |
      | john.doe@gmail.com | England | Road Avenue | 29145      |
    And I send a GraphQL mutation to create a user
    When I send a GraphQL mutation to delete my user
    Then GraphQL confirms the deletion
    And the GraphQL list of users is empty

  @user
  Scenario: I cannot delete a user that does not exist
    When I send a GraphQL mutation to delete the user "2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231"
    Then I receive a GraphQL error with code "NOT_FOUND"

  @user
  Scenario: I cannot delete a user with an invalid id
    When I send a GraphQL mutation to delete the user "not-a-uuid"
    Then I receive a GraphQL error with code "BAD_USER_INPUT"

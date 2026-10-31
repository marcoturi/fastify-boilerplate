Feature: Create a user via GraphQL

  @user
  Scenario: I can create a user
    Given user profile data
      | email              | country | street   | postalCode |
      | jane.doe@gmail.com | Italy   | Via Roma | 10100      |
    When I send a GraphQL mutation to create a user
    Then I receive my user ID from GraphQL
    And I can see my user in the GraphQL list of users

  @user
  Scenario: I cannot create two users with the same email
    Given user profile data
      | email              | country | street   | postalCode |
      | jane.doe@gmail.com | Italy   | Via Roma | 10100      |
    And I send a GraphQL mutation to create a user
    And I receive my user ID from GraphQL
    When I send a GraphQL mutation to create a user
    Then I receive a GraphQL error with code "USER_ALREADY_EXISTS"

  @user
  Scenario Outline: I try to create a user with invalid data
    Given user profile data
      | email   | country   | street   | postalCode   |
      | <Email> | <Country> | <Street> | <PostalCode> |
    When I send a GraphQL mutation to create a user
    Then I receive a GraphQL error with code "BAD_USER_INPUT"
    And the GraphQL error points to "<Path>"

    Examples:
      | Email          | Country | Street      | PostalCode | Path        |
      | johngmail.com  | England | Road Avenue | 29145      | /email      |
      | john@gmail.com | 123     | Road Avenue | 29145      | /country    |
      | johng@mail.com | England | 123         | 29145      | /street     |
      | johng@mail.com | England | Road Avenue | @          | /postalCode |
      | #@!$           | $#@1    | %542        | !321       | /email      |

  @user
  Scenario: I cannot create a user with missing data
    Given user profile data
      | email              | country | street   |
      | jane.doe@gmail.com | Italy   | Via Roma |
    When I send a GraphQL mutation to create a user
    Then I receive a GraphQL validation error

Feature: Find users via GraphQL

  Background: Existing users
    Given these users exist
      | email              | country | street      | postalCode |
      | mario.rossi@pec.it | Italy   | Via Roma    | 10100      |
      | anna.verdi@pec.it  | Italy   | Via Po      | 10124      |
      | john.doe@gmail.com | England | Road Avenue | 29145      |

  @user
  Scenario: I can list all users
    When I query the users via GraphQL
    Then I receive 3 of 3 users
    And every user has ISO creation and update dates

  @user
  Scenario: I can filter users by country
    When I query the users via GraphQL with
      | country | Italy |
    Then I receive 2 of 2 users
    And every user is from "Italy"

  @user
  Scenario: I can filter users by any street a user can be created with
    Given these users exist
      | email               | country       | street         | postalCode |
      | luca.bianchi@pec.it | Côte d'Ivoire | Via 4 Novembre | 10121      |
    When I query the users via GraphQL with
      | street | Via 4 Novembre |
    Then I receive 1 of 1 users

  @user
  Scenario: I can paginate users
    When I query the users via GraphQL with
      | country | Italy |
      | limit   | 1     |
      | page    | 0     |
    Then I receive 1 of 2 users

  @user
  Scenario Outline: I try to list users with invalid arguments
    When I send a GraphQL query for users with
      | <Argument> | <Value> |
    Then I receive a GraphQL error with code "BAD_USER_INPUT"

    Examples:
      | Argument | Value  |
      | limit    | 0      |
      | limit    | null   |
      | limit    | 100000 |
      | page     | -1     |
      | country  | It     |

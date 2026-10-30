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

  @user
  Scenario: I can filter users by country
    When I query the users via GraphQL with
      | country | Italy |
    Then I receive 2 of 2 users
    And every user is from "Italy"

  @user
  Scenario: I can paginate users
    When I query the users via GraphQL with
      | country | Italy |
      | limit   | 1     |
      | page    | 0     |
    Then I receive 1 of 2 users

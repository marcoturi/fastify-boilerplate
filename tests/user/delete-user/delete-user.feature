Feature: Delete a user

  Background: Existing user
    Given user profile data
      | email              | country | street      | postalCode |
      | john.doe@gmail.com | England | Road Avenue | 29145      |
    When I send a request to create a user

  Scenario: I can delete a user
    Given I send a request to delete my user
    Then I cannot see my user in a list of all users

  Scenario: I cannot delete a user that does not exist
    When I send a request to delete the user "2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231"
    Then I receive an error "Not Found" with status code 404

  Scenario: I cannot delete a user with an invalid id
    When I send a request to delete the user "not-a-uuid"
    Then I receive an error "Bad Request" with status code 400
    And the error points to "/id"

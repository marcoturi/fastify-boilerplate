Feature: Readiness probe

  Scenario: The service is ready when the database answers
    When I check whether the service is ready
    Then the service reports that it is ready

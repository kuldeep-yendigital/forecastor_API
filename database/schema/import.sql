USE `Forecast_InMem`;

LOAD DATA INFILE '/var/db/downloads/YearlyForecaster.csv'
  INTO TABLE `YearlyForecaster_mod`
  COLUMNS 
    TERMINATED BY ','
    ENCLOSED BY '"';

LOAD DATA INFILE '/var/db/downloads/YearlyForecasterComplex.csv'
  INTO TABLE `YearlyForecasterComplex_mod`
  COLUMNS 
    TERMINATED BY ','
    ENCLOSED BY '"';

LOAD DATA INFILE '/var/db/downloads/QuarterlyForecaster.csv'
  INTO TABLE `QuarterlyForecaster_mod`
  COLUMNS 
    TERMINATED BY ','
    ENCLOSED BY '"';

LOAD DATA INFILE '/var/db/downloads/QuarterlyForecasterComplex.csv'
  INTO TABLE `QuarterlyForecasterComplex_mod`
  COLUMNS 
    TERMINATED BY ','
    ENCLOSED BY '"';
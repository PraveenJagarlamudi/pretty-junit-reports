<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="/">
        <html lang="en">
            <head>
                <title>Protractor Result file</title>
                <meta charset="utf-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
                <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css"></link>
                <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
                <script src="http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
            </head>
            <body>
                <div class="container">
                    <div class="jumbotron">
                        <h2>Protractor Automation Test Results</h2>
                    </div>
                    <div class="well well-sm">
                        <p><b>User Story: </b><xsl:value-of select="//testsuite[position()=1]/@name"></xsl:value-of></p>
                        <p><b>Start Time: </b><xsl:value-of select="//testsuite[position()=2]/@timestamp"></xsl:value-of><b>     End Time: </b><xsl:value-of select="//testsuite[last()]/@timestamp"></xsl:value-of></p>
                    </div>
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th class="col-md-1">Test ID</th>
                                <th class="col-md-10">Test Case Title</th>
                                <th class="col-md-1">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <xsl:for-each select="testsuites/testsuite[contains(@name,'TEST_ID')]">
                                        <xsl:choose>
                                            <xsl:when test="number(@failures) &gt; 0">
                                                <tr data-toggle="collapse" data-target="#{generate-id(.)}" class="accordion-toggle danger">
                                                <td><xsl:value-of select="substring-before(substring-after(@name,'TEST_ID:'),':')"></xsl:value-of></td>
                                                <td><xsl:value-of select="substring-after(substring-after(@name,'TEST_ID:'),':')"></xsl:value-of></td>
                                                <td><span class="label label-warning">&#160;FAIL&#160;</span></td>
                                                </tr>
                                            </xsl:when>
                                            <xsl:otherwise>
                                                <tr data-toggle="collapse" data-target="#{generate-id(.)}" class="accordion-toggle success">
                                                <td><xsl:value-of select="substring-before(substring-after(@name,'TEST_ID:'),':')"></xsl:value-of></td>
                                                <td><xsl:value-of select="substring-after(substring-after(@name,'TEST_ID:'),':')"></xsl:value-of></td>
                                                <td><span class="label label-success">PASS</span></td>
                                                </tr>
                                            </xsl:otherwise>
                                        </xsl:choose>
                                <xsl:if test="count(testcase) &gt; 0">
                                    <tr class="accordian-body collapse hiddenRow" id="{generate-id(.)}">
                                        <td colspan="12">
                                            <table class="table table-striped table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Test Step Description</th>
                                                        <th>Error Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <xsl:for-each select="testcase">
                                                        <tr>
                                                            <td style="word-wrap: break-word;min-width: 160px;max-width: 160px;"><xsl:value-of select="@name"></xsl:value-of></td>
                                                            <td style="word-wrap: break-word;min-width: 160px;max-width: 160px;">
                                                                <xsl:for-each select="failure">
                                                                    <xsl:value-of select="."></xsl:value-of>
                                                                </xsl:for-each>
                                                            </td>
                                                        </tr>
                                                    </xsl:for-each>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </xsl:if>
                            </xsl:for-each>
                        </tbody>
                    </table>
                </div>

            </body>
        </html>
    </xsl:template>

</xsl:stylesheet>